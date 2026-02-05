#!/usr/bin/env node

// Simple capability probe for Azure OpenAI chat/completions endpoint.
// Usage: node scripts/azure-capabilities.mjs

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
function readArg(name, short) {
  const longKey = `--${name}`;
  const shortKey = short ? `-${short}` : null;
  const idx = args.findIndex((a) => a === longKey || (shortKey && a === shortKey));
  if (idx === -1) return null;
  return args[idx + 1] || null;
}

function hasFlag(name, short) {
  const longKey = `--${name}`;
  const shortKey = short ? `-${short}` : null;
  return args.some((a) => a === longKey || (shortKey && a === shortKey));
}

const jsonOutput = hasFlag("json", "j");

const endpoint =
  readArg("endpoint", "e") ||
  process.env.AZURE_OPENAI_API_ENDPOINT ||
  process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = readArg("api-version", "v") || process.env.AZURE_OPENAI_API_VERSION;
const deployment = readArg("deployment", "d") || process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

const proxy =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy;
const useCurl = Boolean(proxy);

if (!endpoint || !apiKey || !apiVersion || !deployment) {
  console.error(
    "Missing required env vars. Need: AZURE_OPENAI_API_ENDPOINT(or AZURE_OPENAI_ENDPOINT), AZURE_OPENAI_API_KEY, AZURE_OPENAI_API_VERSION, AZURE_OPENAI_DEPLOYMENT_NAME",
  );
  console.error("Optional args: --endpoint/-e, --api-version/-v, --deployment/-d");
  process.exit(1);
}

const url = `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

const decoder = new TextDecoder();

function tryParseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseError(text, status) {
  const json = tryParseJson(text);
  if (json?.error?.message) return json.error.message;
  if (json?.message) return json.message;
  return text || `HTTP ${status}`;
}

function runProc(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

async function postJsonCurl(body, { stream = false } = {}) {
  const dir = await mkdtemp(join(tmpdir(), "az-probe-"));
  const outPath = join(dir, "out.txt");
  const args = [
    "-sS",
    "-X",
    "POST",
    url,
    "-H",
    "Content-Type: application/json",
    "-H",
    `api-key: ${apiKey}`,
    "-d",
    JSON.stringify(body),
    "-o",
    outPath,
    "-w",
    "%{http_code}",
  ];
  if (stream) args.unshift("-N");

  let stdout = "";
  try {
    const res = await runProc("curl", args);
    stdout = res.stdout || "";
  } catch (err) {
    const msg = err?.code === "ENOENT" ? "curl not found in PATH" : err?.message || String(err);
    await rm(dir, { recursive: true, force: true });
    throw new Error(msg);
  }

  const status = Number.parseInt(stdout.trim(), 10) || 0;
  const text = await readFile(outPath, "utf8").catch(() => "");
  await rm(dir, { recursive: true, force: true });

  return {
    ok: status >= 200 && status < 300,
    status,
    text,
    json: stream ? null : tryParseJson(text),
  };
}

async function readStreamText(readable) {
  if (!readable) return "";
  const reader = readable.getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
  }
  return buffer;
}

async function postJson(body, { stream = false } = {}) {
  if (useCurl) {
    return postJsonCurl(body, { stream });
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (stream) {
    const text = await readStreamText(res.body);
    return { ok: res.ok, status: res.status, text, json: null };
  }

  const text = await res.text();
  return { ok: res.ok, status: res.status, text, json: tryParseJson(text) };
}

function resultLine(name, status, details) {
  const pad = name.padEnd(22, " ");
  console.log(`${pad} ${status.padEnd(11, " ")}${details ? " - " + details : ""}`);
}

async function testBasic() {
  const body = {
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Reply with a single word: pong" },
    ],
  };
  const { ok, status, json, text } = await postJson(body);
  if (!ok) {
    return { ok: false, details: parseError(text, status) };
  }
  const model = json?.model || "(model not returned)";
  const content = json?.choices?.[0]?.message?.content || "";
  return { ok: true, details: `model=${model} content=${JSON.stringify(content).slice(0, 40)}` };
}

async function testToolCalling() {
  const body = {
    messages: [
      { role: "system", content: "You must call the provided tool." },
      { role: "user", content: "Call get_time for Paris and do not answer directly." },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "get_time",
          description: "Get current time for a city",
          parameters: {
            type: "object",
            properties: { city: { type: "string" } },
            required: ["city"],
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "get_time" } },
  };
  const { ok, status, json, text } = await postJson(body);
  if (!ok) {
    return { ok: false, details: parseError(text, status) };
  }
  const toolCalls = json?.choices?.[0]?.message?.tool_calls;
  if (Array.isArray(toolCalls) && toolCalls.length > 0) {
    return { ok: true, details: "tool_calls present" };
  }
  return { ok: false, details: "no tool_calls in response" };
}

async function testStreaming() {
  const body = {
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Stream back the word: pong" },
    ],
    stream: true,
  };

  const { ok, status, text } = await postJson(body, { stream: true });
  if (!ok) {
    return { ok: false, details: parseError(text, status) };
  }

  let buffer = text || "";
  let eventCount = 0;
  let idx;
  while ((idx = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trim();
    if (data === "[DONE]") {
      return { ok: true, details: `events=${eventCount}` };
    }
    if (data) eventCount += 1;
  }

  return { ok: eventCount > 0, details: `events=${eventCount}` };
}

async function testVision() {
  const envImage = process.env.AZURE_OPENAI_TEST_IMAGE_URL || "";
  const tinyPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/6XnXQAAAABJRU5ErkJggg==";
  const imageUrl = envImage ? envImage : `data:image/png;base64,${tinyPng}`;
  const body = {
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "What is in this image?" },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
  };
  const { ok, status, json, text } = await postJson(body);
  if (!ok) {
    return { ok: false, details: parseError(text, status) };
  }
  const content = json?.choices?.[0]?.message?.content;
  const hint = envImage ? "custom image url" : "data-url image";
  return { ok: true, details: `${hint} response=${JSON.stringify(content).slice(0, 60)}` };
}

async function testReasoning() {
  // Probe for reasoning-style parameters. If unsupported, Azure usually returns 400 with an unknown-arg error.
  const params =
    (process.env.AZURE_OPENAI_REASONING_PARAMS || "reasoning,reasoning_effort")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

  const base = {
    messages: [
      { role: "system", content: "Be concise." },
      { role: "user", content: "Explain in one sentence why the sky is blue." },
    ],
  };

  for (const param of params) {
    const body = { ...base };
    if (param === "reasoning") {
      body.reasoning = { effort: "medium" };
    } else {
      body[param] = "medium";
    }

    const { ok, status, json, text } = await postJson(body);
    if (!ok) {
      const msg = parseError(text, status);
      if (/unknown parameter|unrecognized field|unsupported parameter/i.test(msg)) {
        continue;
      }
      return { ok: false, details: msg };
    }

    const hasReasoning = json?.choices?.[0]?.message?.reasoning || json?.reasoning || json?.usage?.reasoning;
    if (hasReasoning) {
      return { ok: true, details: `reasoning field present (${param})` };
    }
    return { ok: true, details: `accepted (${param}) (no reasoning field in response)` };
  }

  return { ok: false, details: "unknown reasoning parameter (tried reasoning, reasoning_effort)" };
}

const tests = [
  ["basic chat", testBasic],
  ["tool calling", testToolCalling],
  ["streaming", testStreaming],
  ["vision", testVision],
  ["reasoning", testReasoning],
];

const results = [];

if (!jsonOutput) {
  console.log("Azure OpenAI capability probe");
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Proxy: ${proxy ? "enabled" : "none"}`);
  console.log(`Transport: ${useCurl ? "curl" : "fetch"}`);
  console.log(`Deployment: ${deployment}`);
  console.log(`API version: ${apiVersion}`);
  console.log(`URL: ${url}`);
  console.log("");
}

for (const [name, fn] of tests) {
  try {
    const res = await fn();
    const status = res.ok ? "supported" : "unsupported";
    results.push({ name, status, details: res.details || "" });
    if (!jsonOutput) {
      resultLine(name, res.ok ? "SUPPORTED" : "UNSUPPORTED", res.details);
    }
  } catch (err) {
    let details = err?.message || String(err);
    const cause = err?.cause?.message || err?.cause?.code || (err?.cause ? String(err.cause) : "");
    if (cause) details += ` (cause: ${cause})`;
    results.push({ name, status: "error", details });
    if (!jsonOutput) {
      resultLine(name, "ERROR", details);
    }
  }
}

if (jsonOutput) {
  console.log(
    JSON.stringify({
      endpoint,
      deployment,
      apiVersion,
      proxy: Boolean(proxy),
      transport: useCurl ? "curl" : "fetch",
      results,
    }),
  );
} else {
  console.log("\nDone.");
}
