import { useState, useEffect } from 'react';
import { ConfigForm } from './components/ConfigForm';
import { DebugPanel } from './components/DebugPanel';
import { ChatPanel } from './components/ChatPanel';
import { CapabilitiesPanel } from './components/CapabilitiesPanel';
import { useDebugEvents } from './hooks/useDebugEvents';
import { Message, Config, ChatResponse, CapabilitiesResponse } from './types';

/**
 * Main Application Component
 * 
 * This is the root component that orchestrates the entire application.
 * It manages configuration, chat state, and coordinates between the
 * debug panel and chat panel.
 */
function App() {
  const [configured, setConfigured] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [capabilities, setCapabilities] = useState<CapabilitiesResponse | null>(null);
  const [capabilitiesLoading, setCapabilitiesLoading] = useState(false);
  const [capabilitiesError, setCapabilitiesError] = useState('');
  
  const { debugEvents, connected, clearEvents } = useDebugEvents();

  // Check if already configured
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.configured) {
          setConfigured(true);
        }
      })
      .catch(err => console.error('Failed to check configuration:', err));
  }, []);

  const handleSaveConfig = async (config: Config) => {
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save configuration');
    }

    setConfigured(true);
  };

  const handleSendMessage = async (message: string) => {
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversationId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const data: ChatResponse = await response.json();
      
      // Update conversation ID if it's a new conversation
      if (!conversationId) {
        setConversationId(data.conversationId);
      }

      // Add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };

      // Update messages with user message and assistant response
      setMessages(prev => [...prev, userMessage, data.message]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCapabilities = async () => {
    setCapabilitiesLoading(true);
    setCapabilitiesError('');

    try {
      const response = await fetch('/api/capabilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data: CapabilitiesResponse = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to run capabilities probe');
      }

      if (data.ok === false && data.error) {
        setCapabilitiesError(data.error);
      }

      setCapabilities(data);
    } catch (error: any) {
      setCapabilitiesError(error.message || 'Failed to run capabilities probe');
    } finally {
      setCapabilitiesLoading(false);
    }
  };

  if (!configured) {
    return <ConfigForm onSave={handleSaveConfig} />;
  }

  return (
    <div style={styles.container}>
      {/* Left panel: Debug events */}
      <div style={styles.leftPanel}>
        <CapabilitiesPanel
          data={capabilities}
          loading={capabilitiesLoading}
          error={capabilitiesError}
          onRun={handleRunCapabilities}
        />
        <div style={styles.debugPanelContainer}>
          <DebugPanel
            events={debugEvents}
            connected={connected}
            onClear={clearEvents}
          />
        </div>
      </div>

      {/* Right panel: Chat interface */}
      <div style={styles.rightPanel}>
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          loading={loading}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },
  leftPanel: {
    width: '40%',
    minWidth: '400px',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  rightPanel: {
    flex: 1,
    minWidth: '400px',
  },
  debugPanelContainer: {
    flex: 1,
    minHeight: 0,
  },
};

export default App;
