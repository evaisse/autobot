# AG-UI Protocol Documentation

## What is AG-UI?

AG-UI (Agent-UI) is a communication protocol designed to standardize how AI agents interact with user interfaces. It provides a structured way to:

1. Send messages between users and AI agents
2. Track the internal state and reasoning of agents
3. Visualize the decision-making process
4. Handle tools and function calls
5. Manage conversations and context
6. **Enable dynamic UI creation via A2UI (Agent-to-UI)**

## Core Concepts

### 1. Messages

Messages are the primary unit of communication in AG-UI:

```typescript
interface Message {
  id: string;              // Unique identifier
  role: 'user' | 'assistant' | 'system';  // Who sent the message
  content: string;         // The actual message content
  timestamp: number;       // When it was created
  uiComponents?: UIComponent[];  // Optional A2UI components
}
```

**Roles:**
- `user`: Messages from the human user
- `assistant`: Messages from the AI agent
- `system`: System-level instructions or context

**UI Components:** Messages can optionally include interactive UI components created by the agent using the A2UI protocol.

### 2. Debug Events

Debug events provide transparency into what's happening behind the scenes:

```typescript
interface DebugEvent {
  id: string;                  // Unique identifier
  timestamp: number;           // When the event occurred
  type: EventType;            // What kind of event
  source: EventSource;        // Where it came from
  data: any;                  // Event-specific data
  description: string;         // Human-readable description
}

type EventType = 
  | 'request'      // Request sent to LLM
  | 'response'     // Response received from LLM
  | 'tool_call'    // Tool/function being called
  | 'thought'      // Agent's internal reasoning
  | 'error';       // Error occurred

type EventSource = 
  | 'frontend'     // Event from the UI
  | 'backend'      // Event from the server
  | 'llm';         // Event from the LLM API
```

### 3. Configuration

Configuration defines how to connect to the LLM:

```typescript
interface Config {
  apiEndpoint: string;     // LLM API endpoint
  apiKey: string;          // Authentication key
  model?: string;          // Model to use (optional)
}
```

## Message Flow

Here's how a typical interaction flows through the AG-UI protocol:

```
User Input → Frontend
    ↓
    Debug Event: "User message received" (frontend)
    ↓
HTTP POST /api/chat → Backend
    ↓
    Debug Event: "Sending request to LLM" (backend)
    ↓
OpenAI API Call → LLM
    ↓
LLM Response
    ↓
    Debug Event: "LLM responded" (llm)
    ↓
Save to Storage
    ↓
HTTP Response → Frontend
    ↓
Display Message + Debug Events
```

## WebSocket Events

Real-time debug events are broadcast via WebSocket:

```typescript
// Client connects to ws://localhost:3001
const ws = new WebSocket('ws://localhost:3001');

// Server broadcasts events
ws.send(JSON.stringify({
  type: 'debug_events',
  events: [DebugEvent, DebugEvent, ...]
}));
```

## API Endpoints

### POST /api/config
Save LLM configuration.

**Request:**
```json
{
  "apiEndpoint": "https://api.openai.com/v1",
  "apiKey": "sk-...",
  "model": "gpt-3.5-turbo"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration saved"
}
```

### POST /api/chat
Send a chat message.

**Request:**
```json
{
  "message": "Hello, how are you?",
  "conversationId": "uuid-here"  // Optional
}
```

**Response:**
```json
{
  "message": {
    "id": "uuid",
    "role": "assistant",
    "content": "I'm doing well, thank you!",
    "timestamp": 1234567890
  },
  "conversationId": "uuid-here",
  "debugEvents": [
    {
      "id": "event-uuid",
      "timestamp": 1234567890,
      "type": "request",
      "source": "frontend",
      "data": {...},
      "description": "User message received"
    }
  ]
}
```

## Tool Calling (Future Enhancement)

The AG-UI protocol is designed to support tool calling:

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}
```

When an LLM wants to call a tool:

1. LLM returns a tool call in its response
2. Backend creates a `tool_call` debug event
3. Backend executes the tool
4. Backend sends results back to LLM
5. LLM generates final response

## Best Practices

### 1. Always Include Timestamps
Every message and event should have a timestamp for debugging and analysis.

### 2. Provide Clear Descriptions
Debug events should have human-readable descriptions that make sense to developers.

### 3. Include Context in Data
The `data` field should include enough context to understand what happened, but avoid sensitive information.

### 4. Handle Errors Gracefully
Always create error debug events when something goes wrong, with clear error messages.

### 5. Keep Conversations Stateless
Each API call should include all necessary context (conversation history) rather than relying on server-side session state.

## Example Implementation

See the Autobot codebase for a complete implementation:

- **Backend**: `/packages/backend/src/index.ts`
- **Frontend**: `/packages/frontend/src/App.tsx`
- **Types**: `/packages/backend/src/types/index.ts`

## Future Extensions

The AG-UI protocol can be extended to support:

- **Multi-agent conversations**: Multiple AI agents collaborating
- **Streaming responses**: Real-time token streaming
- **Rich media**: Images, audio, video in messages
- **Agent capabilities**: Dynamic tool discovery
- **Conversation branching**: Exploring different conversation paths
- **Reasoning traces**: Detailed step-by-step reasoning

## A2UI (Agent-to-UI) Protocol

### Overview

A2UI is an extension of AG-UI that enables AI agents to create dynamic, interactive UI components directly within chat conversations. Instead of just text responses, agents can render:

- Buttons for user actions
- Charts for data visualization
- Cards for rich content display
- Forms for input collection
- Tables for structured data
- Progress bars for status indication
- Alerts for notifications
- Lists for organized information

### Component Types

```typescript
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
```

### How A2UI Works

1. **Function Definition**: Backend registers `render_ui_component` as an available function
2. **LLM Decision**: When appropriate, LLM calls this function with component specs
3. **Component Creation**: Backend creates UIComponent object and adds to message
4. **Debug Event**: A `tool_call` event is created for transparency
5. **Frontend Rendering**: UIComponentRenderer dynamically renders the component

### Example: Button Component

**LLM Function Call:**
```json
{
  "name": "render_ui_component",
  "arguments": {
    "type": "button",
    "props": {
      "label": "Primary Action",
      "variant": "primary",
      "action": "perform_action"
    }
  }
}
```

**Resulting UI Component:**
```typescript
{
  id: "uuid",
  type: "button",
  props: {
    label: "Primary Action",
    variant: "primary",
    action: "perform_action"
  }
}
```

### Example: Chart Component

**LLM Function Call:**
```json
{
  "name": "render_ui_component",
  "arguments": {
    "type": "chart",
    "props": {
      "title": "Q4 Sales by Region",
      "chartType": "bar",
      "data": [
        { "label": "North America", "value": 425000 },
        { "label": "Europe", "value": 325000 },
        { "label": "Asia Pacific", "value": 500000 },
        { "label": "Latin America", "value": 200000 }
      ]
    }
  }
}
```

### Benefits of A2UI

1. **Enhanced UX**: Visual components are easier to understand than text
2. **Interactivity**: Users can click buttons, fill forms, etc.
3. **Data Visualization**: Charts make data trends obvious
4. **Structured Information**: Tables and cards organize content
5. **Transparency**: Debug panel shows when and how components are created

### Implementation Notes

- Components are created via OpenAI function calling
- Each component generation creates a debug event
- Components are rendered client-side for flexibility
- All component types are type-safe with TypeScript
- Component props are validated at runtime

## References

- [OpenAI Chat Completions API](https://platform.openai.com/docs/api-reference/chat)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
