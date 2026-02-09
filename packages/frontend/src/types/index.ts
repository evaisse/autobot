/**
 * Shared types between frontend and backend
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  uiComponents?: UIComponent[];
  reasoning?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost?: number;
  };
}

export interface Config {
  apiEndpoint: string;
  apiKey: string;
  model?: string;
  siteUrl?: string;
  siteName?: string;
  includeReasoning?: boolean;
  reasoningEffort?: 'low' | 'medium' | 'high';
  webSearch?: boolean;
}

export interface DebugEvent {
  id: string;
  timestamp: number;
  type: 'request' | 'response' | 'tool_call' | 'thought' | 'error';
  source: 'frontend' | 'backend' | 'llm';
  data: any;
  description: string;
}

export interface ChatResponse {
  message: Message;
  conversationId: string;
  debugEvents: DebugEvent[];
}

export interface CapabilityResult {
  name: string;
  status: 'supported' | 'unsupported' | 'error';
  details?: string;
}

export interface CapabilitiesResponse {
  ok: boolean;
  azure: boolean;
  results: CapabilityResult[];
  error?: string;
  endpoint?: string;
  deployment?: string;
  apiVersion?: string;
}

/**
 * A2UI (Agent-to-UI) Protocol Types
 */

export type UIComponentType = 
  | 'button'
  | 'card'
  | 'list'
  | 'form'
  | 'chart'
  | 'image'
  | 'table'
  | 'progress'
  | 'alert'
  | 'input';

export interface UIComponent {
  id: string;
  type: UIComponentType;
  props: Record<string, any>;
  children?: UIComponent[];
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  architecture: {
    modality: string;
    tokenizer: string;
  };
}

export interface OpenRouterParameters {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  min_p?: number;
  max_tokens?: number;
  include_reasoning?: boolean;
  reasoning_effort?: 'low' | 'medium' | 'high';
  web_search?: boolean;
  response_format?: { type: 'json_object' } | { type: 'json_schema'; json_schema: any };
}
