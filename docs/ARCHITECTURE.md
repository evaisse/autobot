# Autobot Architecture Documentation

## Overview

Autobot is a pedagogical fullstack TypeScript application that demonstrates how modern LLM chatbot applications work. The architecture is intentionally simple and transparent to facilitate learning.

## System Architecture

### High-Level Components

```
┌──────────────────────────────────────────────────────────────┐
│                         Browser                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    React Frontend                       │  │
│  │                                                          │  │
│  │  ┌──────────────┐            ┌──────────────┐         │  │
│  │  │ Debug Panel  │            │ Chat Panel   │         │  │
│  │  │              │            │              │         │  │
│  │  │ - Real-time  │            │ - Messages   │         │  │
│  │  │   events     │            │ - Input      │         │  │
│  │  │ - WebSocket  │            │ - History    │         │  │
│  │  └──────┬───────┘            └──────┬───────┘         │  │
│  │         │                           │                  │  │
│  └─────────┼───────────────────────────┼──────────────────┘  │
└────────────┼───────────────────────────┼─────────────────────┘
             │ WebSocket                 │ HTTP
             │ (Debug Events)            │ (API Calls)
             │                           │
┌────────────┼───────────────────────────┼─────────────────────┐
│            │                           │                      │
│  ┌─────────▼───────────────────────────▼──────────────────┐  │
│  │              Express + WebSocket Server               │  │
│  │                                                         │  │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌────────┐ │  │
│  │  │ REST    │  │   WS    │  │   LLM    │  │ Storage│ │  │
│  │  │ API     │  │ Handler │  │ Service  │  │ (JSON) │ │  │
│  │  └────┬────┘  └────┬────┘  └────┬─────┘  └───┬────┘ │  │
│  │       │            │            │             │       │  │
│  └───────┼────────────┼────────────┼─────────────┼───────┘  │
│          │            │            │             │           │
│       Node.js Runtime Environment                            │
└──────────┼────────────┼────────────┼─────────────┼───────────┘
           │            │            │             │
           │            │            │         ┌───▼────┐
           │            │            │         │ data/  │
           │            │            │         │ *.json │
           │            │            │         └────────┘
           │            │            │
           │            │        ┌───▼──────────────────┐
           │            │        │  OpenAI API          │
           │            │        │  https://api.        │
           │            │        │  openai.com/v1       │
           │            │        └──────────────────────┘
           │            │
      [HTTP Client]  [WebSocket Client]
```

## Component Breakdown

### 1. Frontend (`/packages/frontend`)

#### Technology Stack
- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server

#### Key Components

**ConfigForm** (`src/components/ConfigForm.tsx`)
- Purpose: Collect OpenAI API credentials
- Input: API endpoint, API key, model name
- Output: Saves configuration to backend
- UI: Centered form with validation

**ChatPanel** (`src/components/ChatPanel.tsx`)
- Purpose: Main chat interface
- Features:
  - Message display with role indicators
  - Auto-scrolling
  - Input field with send button
  - Loading states
- Layout: Right side of the two-panel layout

**DebugPanel** (`src/components/DebugPanel.tsx`)
- Purpose: Real-time debug event visualization
- Features:
  - Color-coded event types
  - Expandable data payloads
  - Connection status indicator
  - Clear events button
- Layout: Left side of the two-panel layout

**useDebugEvents** (`src/hooks/useDebugEvents.ts`)
- Purpose: WebSocket connection management
- Responsibilities:
  - Connect to WebSocket server
  - Receive and accumulate debug events
  - Handle connection lifecycle
  - Provide connection status

#### Data Flow

```
User Input → ConfigForm → POST /api/config → Backend
User Message → ChatPanel → POST /api/chat → Backend
WebSocket ← Backend ← Debug Events
```

### 2. Backend (`/packages/backend`)

#### Technology Stack
- **Express**: HTTP server
- **ws**: WebSocket server
- **OpenAI SDK**: LLM API client
- **TypeScript**: Type safety

#### Key Modules

**Main Server** (`src/index.ts`)
- Purpose: HTTP and WebSocket server
- Responsibilities:
  - Route HTTP requests
  - Manage WebSocket connections
  - Broadcast debug events
  - Coordinate between modules

**LLM Service** (`src/services/llm.ts`)
- Purpose: Interface with OpenAI API
- Responsibilities:
  - Configure API client
  - Send chat requests
  - Create debug events
  - Handle errors

**Storage** (`src/storage/index.ts`)
- Purpose: Persist data locally
- Responsibilities:
  - Save/load configuration
  - Save/load conversations
  - List conversations
- Storage Format: JSON files in `data/` directory

#### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/config` | POST | Save configuration |
| `/api/config` | GET | Get configuration |
| `/api/chat` | POST | Send chat message |
| `/api/conversations/:id` | GET | Get conversation |
| `/api/conversations` | GET | List conversations |
| `/api/tools` | GET | Get available tools |

#### WebSocket Protocol

**Client → Server**: Connection only
**Server → Client**: 
```json
{
  "type": "debug_events",
  "events": [
    {
      "id": "uuid",
      "timestamp": 1234567890,
      "type": "request|response|tool_call|thought|error",
      "source": "frontend|backend|llm",
      "data": {},
      "description": "Human readable text"
    }
  ]
}
```

## Data Flow Example

### Sending a Chat Message

1. **User Action**: Types message and clicks "Send"
2. **Frontend**: 
   - Creates debug event (frontend source)
   - Sends POST to `/api/chat`
3. **Backend**:
   - Receives request
   - Creates debug event (backend source)
   - Broadcasts via WebSocket
   - Loads conversation history from storage
   - Calls LLM service
4. **LLM Service**:
   - Creates debug event (LLM request)
   - Broadcasts via WebSocket
   - Calls OpenAI API
   - Receives response
   - Creates debug event (LLM response)
   - Broadcasts via WebSocket
5. **Backend**:
   - Saves updated conversation to storage
   - Returns response to frontend
6. **Frontend**:
   - Updates message list
   - Debug panel shows all events in real-time

## AG-UI Protocol Implementation

### Message Structure

```typescript
interface Message {
  id: string;          // UUID
  role: 'user' | 'assistant' | 'system';
  content: string;     // Message text
  timestamp: number;   // Unix timestamp
}
```

### Debug Event Structure

```typescript
interface DebugEvent {
  id: string;              // UUID
  timestamp: number;       // Unix timestamp
  type: EventType;        // Event category
  source: EventSource;    // Origin component
  data: any;              // Event-specific payload
  description: string;     // Human-readable summary
}
```

### Event Types

- **request**: Outgoing API request
- **response**: Incoming API response
- **tool_call**: Function/tool invocation
- **thought**: Internal reasoning (future)
- **error**: Error condition

### Event Sources

- **frontend**: User actions, UI events
- **backend**: Server processing, routing
- **llm**: LLM API calls and responses

## Storage System

### File Structure

```
data/
├── config.json                    # API configuration
├── conversation_{uuid}.json       # Conversation history
└── conversation_{uuid}.json       # Another conversation
```

### Configuration File

```json
{
  "apiEndpoint": "https://api.openai.com/v1",
  "apiKey": "sk-...",
  "model": "gpt-3.5-turbo"
}
```

### Conversation File

```json
[
  {
    "id": "msg-1",
    "role": "user",
    "content": "Hello!",
    "timestamp": 1234567890000
  },
  {
    "id": "msg-2",
    "role": "assistant",
    "content": "Hi! How can I help you?",
    "timestamp": 1234567891000
  }
]
```

## Security Considerations

### Current Implementation (Development)

- API keys stored in plain JSON files
- No encryption at rest
- No authentication on API endpoints
- CORS enabled for all origins
- WebSocket open to all connections

### Production Recommendations

1. **Secrets Management**
   - Use environment variables
   - Implement secure key storage
   - Add encryption at rest

2. **Authentication**
   - Add user authentication
   - Implement API key rotation
   - Session management

3. **Network Security**
   - HTTPS/WSS only
   - Restrict CORS origins
   - Rate limiting
   - Request validation

4. **Data Protection**
   - Encrypt stored conversations
   - Implement data retention policies
   - Add privacy controls

## Extensibility

### Adding New Event Types

1. Update `EventType` in `types/index.ts`
2. Add color mapping in `DebugPanel.tsx`
3. Create events in appropriate service

### Adding Tool Support

1. Define tools in `LLMService.getAvailableTools()`
2. Implement tool execution logic
3. Update OpenAI API call to include tools
4. Handle tool calls in response
5. Create `tool_call` debug events

### Adding New Storage Backends

1. Implement `Storage` interface
2. Update storage initialization
3. Handle migration if needed

### Adding Streaming Support

1. Modify LLM service to use streaming API
2. Update frontend to handle partial responses
3. Add streaming-specific debug events
4. Update UI to show typing indicators

## Development Workflow

### Starting Development

```bash
# Terminal 1: Backend
cd packages/backend
npm run dev

# Terminal 2: Frontend
cd packages/frontend
npm run dev
```

### Building for Production

```bash
# Build both packages
npm run build

# Run production backend
cd packages/backend
npm start

# Serve frontend build
cd packages/frontend
npm run preview
```

### Adding Dependencies

```bash
# Backend
cd packages/backend
npm install <package>

# Frontend
cd packages/frontend
npm install <package>
```

## Performance Considerations

### Current Performance

- **Frontend**: Minimal re-renders, efficient event accumulation
- **Backend**: Synchronous I/O (suitable for demo)
- **Storage**: No caching (reads from disk each time)
- **WebSocket**: All events broadcast to all clients

### Optimization Opportunities

1. **Caching**: Add in-memory cache for conversations
2. **Pagination**: Limit events/messages displayed
3. **Database**: Replace file storage with database
4. **Connection Pool**: Reuse database connections
5. **Message Queuing**: Decouple event broadcasting

## Testing Strategy

### Unit Tests (Future)

- Storage operations
- LLM service logic
- Component behavior

### Integration Tests (Future)

- API endpoint flows
- WebSocket communication
- End-to-end chat flow

### Manual Testing

1. Configuration flow
2. Chat interaction
3. Debug event display
4. Error handling
5. Connection recovery

## Deployment

### Development

```bash
npm run dev
```

### Production Options

1. **Separate Deployment**
   - Backend: Node.js server (e.g., PM2)
   - Frontend: Static hosting (e.g., Netlify)

2. **Combined Deployment**
   - Build frontend
   - Serve frontend from backend
   - Deploy as single Node.js app

3. **Container Deployment**
   - Dockerfile for backend
   - Dockerfile for frontend
   - Docker Compose for local development

## Troubleshooting

### WebSocket Connection Issues

- Check backend is running on port 3001
- Verify no firewall blocking WebSocket
- Check browser console for errors

### Chat Not Working

- Verify configuration saved
- Check API key is valid
- Review backend logs for errors
- Check network tab for failed requests

### Build Errors

- Clear node_modules and reinstall
- Check TypeScript version compatibility
- Verify all dependencies installed

## Future Enhancements

1. **Multi-agent Support**: Multiple AI agents in one conversation
2. **Conversation Branching**: Explore different conversation paths
3. **Streaming Responses**: Real-time token streaming
4. **Rich Media**: Support images, code blocks, etc.
5. **Tool System**: Dynamic tool discovery and execution
6. **Reasoning Traces**: Visualize agent thinking process
7. **User Authentication**: Multi-user support
8. **Cloud Storage**: PostgreSQL/MongoDB integration

## References

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
