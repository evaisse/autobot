# 🤖 Autobot - LLM AG-UI Demo Application

A pedagogical fullstack TypeScript demonstration application showcasing how LLM chatbot frontends interact with their backends using the AG-UI (Agent-UI) protocol with **A2UI support** for dynamic UI component rendering.

## 📚 Overview

Autobot is designed to **teach and demonstrate** the technical architecture of modern LLM applications. It features:

- **Real-time visualization** of all exchanges between frontend ↔ backend ↔ LLM
- **AG-UI protocol** implementation for structured agent communication
- **A2UI (Agent-to-UI)** support - LLMs can create interactive UI components (buttons, charts, cards, forms, etc.)
- **Two-panel interface**: Technical debug view + User chat view
- **Ultra-simple embedded storage** using JSON files
- **Full TypeScript** codebase for type safety and clarity

## 🎯 Educational Goals

This project helps developers understand:

1. **How LLM APIs work** - See actual requests and responses
2. **Backend orchestration** - Observe message routing and state management
3. **Real-time communication** - Learn WebSocket patterns for live updates
4. **AG-UI protocol** - Understand structured agent-to-UI communication
5. **A2UI protocol** - Learn how LLMs can create dynamic UI components
6. **Function calling** - See how LLMs use tools to enhance responses
7. **Fullstack architecture** - See how all pieces fit together

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

## 🔍 Azure OpenAI Capability Probe (Optional)

If you're targeting Azure OpenAI endpoints, you can run a small probe script to see which features your deployment supports (tool calling, streaming, vision, and reasoning parameters). It sends a handful of minimal test requests and prints a simple PASS/FAIL table.

```bash
export AZURE_OPENAI_API_ENDPOINT="https://YOUR-RESOURCE.openai.azure.com"
export AZURE_OPENAI_API_KEY="YOUR_KEY"
export AZURE_OPENAI_API_VERSION="YOUR_API_VERSION"
export AZURE_OPENAI_DEPLOYMENT_NAME="YOUR_DEPLOYMENT"

npm run azure:capabilities
```

Optional extras:
- `AZURE_OPENAI_TEST_IMAGE_URL` to probe vision with a real image URL
- `AZURE_OPENAI_REASONING_PARAMS` to override which reasoning params to try
- CLI overrides: `--endpoint`, `--api-version`, `--deployment`

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
4. **Backend** calls the OpenAI API with function calling enabled (A2UI tools)
5. **LLM** processes the request and may call UI component creation functions
6. **Backend** parses tool calls and creates UI components
7. **Backend** saves the updated conversation to storage
8. **Backend** broadcasts debug events via WebSocket
9. **Frontend** displays the response with any UI components

### 3. A2UI Component Rendering

When the LLM decides to create a UI component:

1. **LLM** calls the `render_ui_component` function with type and props
2. **Backend** creates a `tool_call` debug event
3. **Component** is added to the message's `uiComponents` array
4. **Frontend** UIComponentRenderer dynamically renders the component
5. **Debug panel** shows the component creation in real-time

**Supported Components:**
- 🔘 **Buttons** - Interactive actions with variants
- 🎴 **Cards** - Rich content with images and actions
- 📊 **Charts** - Data visualizations (bar, line, pie)
- 📝 **Lists** - Organized items with icons
- 📋 **Forms** - Input collection fields
- 📑 **Tables** - Structured data display
- 📈 **Progress** - Task completion indicators
- ⚠️ **Alerts** - Notifications with severity levels

### 4. Debug Visualization

The debug panel shows every step in real-time:
- 🖥️ Frontend events (user actions)
- ⚙️ Backend events (processing)
- 🤖 LLM events (API calls and responses)
- 🎨 Tool calls (UI component creation)

Each event includes:
- Timestamp
- Event type (request, response, tool_call, error, etc.)
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

## 🎨 A2UI Component Examples

The application includes demonstration pages showcasing different UI components:

### Button Components
Ask: "Show me some button options"

The LLM creates interactive buttons with different variants:
- Primary actions (blue)
- Secondary actions (gray)
- Danger actions (red)

### Chart Visualizations
Ask: "Show me sales data for this quarter"

The LLM visualizes data as bar charts with:
- Multiple data series
- Animated bars
- Value labels
- Professional styling

### Card Components
Ask: "Show me information about the new feature"

The LLM creates rich content cards with:
- Header images or icons
- Titles and descriptions
- Action buttons
- Clean, modern design

**View live demos:** Visit `/demos/demo-button.html`, `/demos/demo-chart.html`, or `/demos/demo-card.html` after starting the dev server.

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
3. Explore `/packages/backend/src/services/llm.ts` - LLM integration with A2UI
4. Check `/packages/frontend/src/components/UIComponentRenderer.tsx` - Dynamic UI rendering
5. Review `/packages/frontend/src/components/DebugPanel.tsx` - Event visualization

Every file is thoroughly commented to aid understanding!

---

**Happy Learning! 🚀**
