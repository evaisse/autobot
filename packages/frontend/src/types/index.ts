/**
 * Shared types between frontend and backend
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  uiComponents?: UIComponent[];
}

export interface Config {
  apiEndpoint: string;
  apiKey: string;
  model?: string;
  azureApiVersion?: string;
  azureDeployment?: string;
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
