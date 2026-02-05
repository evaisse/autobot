import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { storage } from './storage';
import { llmService } from './services/llm';
import { Message, Config, DebugEvent, CapabilitiesResponse } from './types';

/**
 * Autobot Backend Server
 * 
 * This server implements the AG-UI protocol and provides:
 * - REST API for configuration and chat
 * - WebSocket for real-time debug events
 * - Simple file-based storage
 * 
 * The server is designed to be pedagogical and demonstrate
 * how LLM interactions work in a fullstack application.
 */

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store WebSocket connections
const wsConnections = new Set<WebSocket>();

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  wsConnections.add(ws);

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    wsConnections.delete(ws);
  });
});

/**
 * Broadcast debug events to all connected WebSocket clients
 */
function broadcastDebugEvents(events: DebugEvent[]): void {
  const message = JSON.stringify({ type: 'debug_events', events });
  wsConnections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

function resolveAzureProbePath(): string | null {
  const candidates = [
    path.resolve(process.cwd(), 'scripts', 'azure-capabilities.mjs'),
    path.resolve(process.cwd(), '..', '..', 'scripts', 'azure-capabilities.mjs'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function looksLikeAzureEndpoint(endpoint: string): boolean {
  return endpoint.includes('openai.azure.com');
}

async function runAzureCapabilitiesProbe(config: Config): Promise<CapabilitiesResponse> {
  const scriptPath = resolveAzureProbePath();
  if (!scriptPath) {
    return {
      ok: false,
      azure: true,
      results: [],
      error: 'Azure probe script not found',
    };
  }

  if (!config.azureApiVersion || !config.azureDeployment) {
    return {
      ok: false,
      azure: true,
      results: [],
      error: 'Azure API version and deployment are required to run the probe',
      endpoint: config.apiEndpoint,
    };
  }

  return await new Promise((resolve) => {
    const args = [
      scriptPath,
      '--json',
      '--endpoint',
      config.apiEndpoint,
      '--api-version',
      config.azureApiVersion,
      '--deployment',
      config.azureDeployment,
    ];

    const child = spawn('node', args, {
      env: {
        ...process.env,
        AZURE_OPENAI_API_KEY: config.apiKey,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return resolve({
          ok: false,
          azure: true,
          results: [],
          error: stderr.trim() || `Probe exited with code ${code}`,
          endpoint: config.apiEndpoint,
          deployment: config.azureDeployment,
          apiVersion: config.azureApiVersion,
        });
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        return resolve({
          ok: true,
          azure: true,
          results: parsed.results || [],
          endpoint: parsed.endpoint || config.apiEndpoint,
          deployment: parsed.deployment || config.azureDeployment,
          apiVersion: parsed.apiVersion || config.azureApiVersion,
        });
      } catch (error: any) {
        return resolve({
          ok: false,
          azure: true,
          results: [],
          error: `Failed to parse probe output: ${error.message}`,
          endpoint: config.apiEndpoint,
          deployment: config.azureDeployment,
          apiVersion: config.azureApiVersion,
        });
      }
    });
  });
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Configuration endpoints
app.post('/api/config', (req: Request, res: Response) => {
  try {
    const config: Config = req.body;
    
    // Validate config
    if (!config.apiKey || !config.apiEndpoint) {
      return res.status(400).json({ error: 'Missing required configuration' });
    }

    // Save config and configure LLM service
    storage.saveConfig(config);
    llmService.configure(config);

    res.json({ success: true, message: 'Configuration saved' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/config', (req: Request, res: Response) => {
  try {
    const config = storage.loadConfig();
    
    // Don't send API key back to client
    if (config) {
      const { apiKey, ...safeConfig } = config;
      return res.json({ ...safeConfig, configured: true });
    }
    
    res.json({ configured: false });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Chat endpoints
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!llmService.isConfigured()) {
      return res.status(400).json({ error: 'LLM service not configured' });
    }

    const convId = conversationId || uuidv4();

    // Load existing conversation
    const messages = storage.loadConversation(convId);

    // Add system prompt for A2UI support on first message
    if (messages.length === 0) {
      messages.push({
        id: uuidv4(),
        role: 'system',
        content: `You are a helpful AI assistant with the ability to create interactive UI components using the A2UI (Agent-to-UI) protocol.

You can enhance your responses by rendering visual components such as:
- Buttons: Interactive actions
- Cards: Rich content with images and actions
- Lists: Organized information
- Charts: Data visualizations (bar charts only)
- Forms: User input collection
- Tables: Structured data display
- Progress bars: Task completion status
- Alerts: Important notifications

When appropriate, use the render_ui_component function to create these components. For example:
- Show data as a chart instead of plain text
- Present options as buttons
- Display information as cards
- Create interactive forms for user input

Always provide both textual context and visual components when it enhances understanding.`,
        timestamp: Date.now(),
      });
    }

    // Create debug event for incoming message
    const incomingDebugEvent: DebugEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'request',
      source: 'frontend',
      data: { message },
      description: 'User message received',
    };
    broadcastDebugEvents([incomingDebugEvent]);

    // Add new user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    messages.push(userMessage);

    // Get LLM response
    const { message: assistantMessage, debugEvents } = await llmService.chat(messages);
    
    // Broadcast debug events
    broadcastDebugEvents(debugEvents);

    // Add assistant message
    messages.push(assistantMessage);

    // Save conversation
    storage.saveConversation(convId, messages);

    res.json({
      message: assistantMessage,
      conversationId: convId,
      debugEvents: [incomingDebugEvent, ...debugEvents],
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    
    const errorEvent: DebugEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'error',
      source: 'backend',
      data: { error: error.message },
      description: `Error: ${error.message}`,
    };
    broadcastDebugEvents([errorEvent]);

    res.status(500).json({ error: error.message });
  }
});

app.get('/api/conversations/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const messages = storage.loadConversation(id);
    res.json({ messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/conversations', (req: Request, res: Response) => {
  try {
    const conversations = storage.listConversations();
    res.json({ conversations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Capabilities endpoint (Azure probe)
app.post('/api/capabilities', async (req: Request, res: Response) => {
  try {
    const config: Config | null = storage.loadConfig();

    if (!config) {
      return res.status(400).json({
        ok: false,
        azure: false,
        results: [],
        error: 'Configuration not found',
      });
    }

    const isAzure = looksLikeAzureEndpoint(config.apiEndpoint) || Boolean(config.azureApiVersion || config.azureDeployment);
    if (!isAzure) {
      return res.json({
        ok: false,
        azure: false,
        results: [],
        error: 'Capabilities probe is only available for Azure OpenAI endpoints',
      });
    }

    const result = await runAzureCapabilitiesProbe(config);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      azure: false,
      results: [],
      error: error.message || 'Failed to run capabilities probe',
    });
  }
});

// Tools endpoint (for demonstration)
app.get('/api/tools', (req: Request, res: Response) => {
  const tools = llmService.getAvailableTools();
  res.json({ tools });
});

// Start server
server.listen(PORT, () => {
  console.log(`🤖 Autobot backend server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready for debug events`);
  console.log(`📚 Visit the frontend to start chatting with your LLM!`);
});
