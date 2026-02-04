# 🤖 Autobot - LLM AG-UI Demo Application

A pedagogical fullstack TypeScript demonstration application showcasing how LLM chatbot frontends interact with their backends using the AG-UI (Agent-UI) protocol.

## 📚 Overview

Autobot is designed to **teach and demonstrate** the technical architecture of modern LLM applications. It features:

- **Real-time visualization** of all exchanges between frontend ↔ backend ↔ LLM
- **AG-UI protocol** implementation for structured agent communication
- **Two-panel interface**: Technical debug view + User chat view
- **Ultra-simple embedded storage** using JSON files
- **Full TypeScript** codebase for type safety and clarity

## 🎯 Educational Goals

This project helps developers understand:

1. **How LLM APIs work** - See actual requests and responses
2. **Backend orchestration** - Observe message routing and state management
3. **Real-time communication** - Learn WebSocket patterns for live updates
4. **AG-UI protocol** - Understand structured agent-to-UI communication
5. **Fullstack architecture** - See how all pieces fit together

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────┐              ┌───────────────┐       │
│  │ Debug Panel  │              │  Chat Panel   │       │
│  │ (Technical)  │              │  (User View)  │       │
│  └──────────────┘              └───────────────┘       │
│         ↕ WebSocket                    ↕ HTTP          │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│              Backend (Express + WebSocket)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Storage    │  │  LLM Service │  │  Debug Events│ │
│  │  (JSON)      │  │   (OpenAI)   │  │  Broadcaster │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                         ↕
              ┌────────────────────┐
              │   OpenAI API       │
              │   (or compatible)  │
              └────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key (or compatible endpoint)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/evaisse/autobot.git
cd autobot
```

2. Install dependencies:
```bash
npm install
```

3. Start the development servers:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend application on `http://localhost:3000`

4. Open your browser to `http://localhost:3000`

5. Configure your OpenAI API credentials:
   - API Endpoint: `https://api.openai.com/v1`
   - API Key: Your OpenAI API key
   - Model: `gpt-3.5-turbo` (or any compatible model)

6. Start chatting and watch the debug panel to see everything that happens!

## 📁 Project Structure

```
autobot/
├── packages/
│   ├── backend/          # Express backend server
│   │   ├── src/
│   │   │   ├── index.ts          # Main server file
│   │   │   ├── types/            # TypeScript type definitions
│   │   │   ├── storage/          # Simple file-based storage
│   │   │   └── services/         # LLM service implementation
│   │   └── package.json
│   │
│   └── frontend/         # React frontend application
│       ├── src/
│       │   ├── App.tsx           # Main app component
│       │   ├── components/       # React components
│       │   │   ├── ConfigForm.tsx    # API configuration
│       │   │   ├── ChatPanel.tsx     # Chat interface
│       │   │   └── DebugPanel.tsx    # Debug events display
│       │   ├── hooks/            # Custom React hooks
│       │   └── types/            # TypeScript type definitions
│       └── package.json
│
├── package.json          # Root package (workspace)
└── README.md            # This file
```

## 🔧 How It Works

### 1. Configuration Phase

The user provides their OpenAI API credentials through a simple form. These are stored locally using the embedded JSON storage system.

### 2. Chat Interaction

When a user sends a message:

1. **Frontend** creates a "user message received" debug event
2. **Backend** receives the message via HTTP POST
3. **Backend** loads conversation history from storage
4. **Backend** calls the OpenAI API with the full context
5. **LLM** processes the request and returns a response
6. **Backend** saves the updated conversation to storage
7. **Backend** broadcasts debug events via WebSocket
8. **Frontend** displays both the response and debug events

### 3. Debug Visualization

The debug panel shows every step in real-time:
- 🖥️ Frontend events (user actions)
- ⚙️ Backend events (processing)
- 🤖 LLM events (API calls and responses)

Each event includes:
- Timestamp
- Event type (request, response, error, etc.)
- Source component
- Detailed data payload
- Human-readable description

## 🛠️ API Endpoints

### Configuration

- `POST /api/config` - Save API configuration
- `GET /api/config` - Get current configuration (without API key)

### Chat

- `POST /api/chat` - Send a chat message
- `GET /api/conversations/:id` - Get conversation history
- `GET /api/conversations` - List all conversations

### Tools (Demonstration)

- `GET /api/tools` - Get available LLM tools

### WebSocket

- `ws://localhost:3001` - Real-time debug events

## 🎨 AG-UI Protocol

The AG-UI (Agent-UI) protocol is a structured communication pattern between LLM agents and user interfaces. Key concepts:

### Message Flow

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}
```

### Debug Events

```typescript
interface DebugEvent {
  id: string;
  timestamp: number;
  type: 'request' | 'response' | 'tool_call' | 'thought' | 'error';
  source: 'frontend' | 'backend' | 'llm';
  data: any;
  description: string;
}
```

## 💾 Storage System

Autobot uses an ultra-simple file-based storage system:

- **Configuration**: `data/config.json`
- **Conversations**: `data/conversation_{id}.json`

This approach is perfect for:
- Local development
- Demonstrations
- Learning purposes
- Quick prototyping

For production use, you would replace this with a proper database.

## 🔒 Security Notes

- API keys are stored in local files only
- Keys are never sent to any third party except OpenAI
- The debug panel helps you verify what data is being sent
- For production, use environment variables and secure storage

## 🤝 Contributing

This is a pedagogical project! Contributions that improve:
- Documentation and explanations
- Code clarity and comments
- Educational value
- Examples and use cases

are highly welcome!

## 📄 License

MIT License - Feel free to use this project for learning and teaching!

## 🙏 Acknowledgments

- Inspired by the need to understand LLM architectures
- Built to demonstrate the AG-UI protocol concepts
- Created for the developer community to learn from

## 📖 Learn More

To dive deeper into the codebase:

1. Start with `/packages/backend/src/index.ts` - Main server logic
2. Read `/packages/frontend/src/App.tsx` - Frontend orchestration
3. Explore `/packages/backend/src/services/llm.ts` - LLM integration
4. Check `/packages/frontend/src/components/DebugPanel.tsx` - Event visualization

Every file is thoroughly commented to aid understanding!

---

**Happy Learning! 🚀**
