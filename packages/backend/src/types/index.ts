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
  uiComponents?: UIComponent[];
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

/**
 * A2UI (Agent-to-UI) Protocol Types
 * 
 * Enables LLMs to create and render interactive UI components
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

export interface ButtonComponent extends UIComponent {
  type: 'button';
  props: {
    label: string;
    variant?: 'primary' | 'secondary' | 'danger';
    action?: string;
  };
}

export interface CardComponent extends UIComponent {
  type: 'card';
  props: {
    title: string;
    description?: string;
    imageUrl?: string;
    actions?: Array<{ label: string; action: string }>;
  };
}

export interface ListComponent extends UIComponent {
  type: 'list';
  props: {
    items: Array<{ label: string; value: string; icon?: string }>;
    ordered?: boolean;
  };
}

export interface ChartComponent extends UIComponent {
  type: 'chart';
  props: {
    title: string;
    chartType: 'bar' | 'line' | 'pie';
    data: Array<{ label: string; value: number }>;
  };
}

export interface FormComponent extends UIComponent {
  type: 'form';
  props: {
    title: string;
    fields: Array<{ name: string; label: string; type: string; required?: boolean }>;
    submitLabel?: string;
  };
}

export interface TableComponent extends UIComponent {
  type: 'table';
  props: {
    headers: string[];
    rows: Array<Record<string, any>>;
  };
}

export interface ProgressComponent extends UIComponent {
  type: 'progress';
  props: {
    value: number;
    max: number;
    label?: string;
  };
}

export interface AlertComponent extends UIComponent {
  type: 'alert';
  props: {
    message: string;
    severity: 'info' | 'success' | 'warning' | 'error';
    title?: string;
  };
}
