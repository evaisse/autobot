/**
 * AG-UI Protocol Types
 * 
 * This file defines the types for the AG-UI (Agent-UI) protocol,
 * which enables structured communication between the frontend and LLM backend.
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Config {
  apiEndpoint: string;
  apiKey: string;
  model?: string;
}

export interface DebugEvent {
  id: string;
  timestamp: number;
  type: 'request' | 'response' | 'tool_call' | 'thought' | 'error';
  source: 'frontend' | 'backend' | 'llm';
  data: any;
  description: string;
}

export interface ChatRequest {
  message: string;
  conversationId: string;
}

export interface ChatResponse {
  message: Message;
  debugEvents: DebugEvent[];
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}
