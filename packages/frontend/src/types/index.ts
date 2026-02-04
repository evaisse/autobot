/**
 * Shared types between frontend and backend
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

export interface ChatResponse {
  message: Message;
  conversationId: string;
  debugEvents: DebugEvent[];
}
