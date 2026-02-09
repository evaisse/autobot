import { useState, useEffect, useCallback, useMemo } from 'react';
import { ConfigForm } from './components/ConfigForm';
import { DebugPanel } from './components/DebugPanel';
import { ChatPanel } from './components/ChatPanel';
import { DatabasePanel } from './components/DatabasePanel';
import { ConversationsPanel } from './components/ConversationsPanel';
import { FlowPanel } from './components/FlowPanel';
import { openRouterService } from './services/OpenRouterService';
import { storageService } from './services/StorageService';
import { Message, Config, DebugEvent, OpenRouterModel } from './types';
import { v4 as uuidv4 } from 'uuid';

type LeftTab = 'chat' | 'db' | 'history';

function App() {
  const [configured, setConfigured] = useState(false);
  const [debugEvents, setDebugEvents] = useState<DebugEvent[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<LeftTab>('chat');
  const [currentConversationId, setCurrentConversationId] = useState<string>(uuidv4());
  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.0-flash-001');

  // Load config and initial messages
  useEffect(() => {
    const init = async () => {
      const savedConfig = await storageService.getConfig();
      if (savedConfig) {
        openRouterService.configure(savedConfig);
        setConfigured(true);
        if (savedConfig.model) setSelectedModel(savedConfig.model);
        
        try {
          const models = await openRouterService.getModels();
          setAvailableModels(models);
        } catch (e) {
          console.error('Erreur chargement modèles:', e);
        }
      }
      
      const conversations = await storageService.listConversations();
      if (conversations.length > 0) {
        const last = conversations.sort((a, b) => b.updatedAt - a.updatedAt)[0];
        const events = last.events || [];
        setDebugEvents(events);
        setHistoryIndex(events.length - 1);
        setCurrentConversationId(last.id);
      }
    };
    init();
  }, []);

  const addDebugEvent = useCallback(async (event: DebugEvent) => {
    setDebugEvents(prev => {
      const next = [...prev, event];
      setHistoryIndex(next.length - 1);
      // Auto-save
      storageService.saveConversation(currentConversationId, next);
      return next;
    });
  }, [currentConversationId]);

  const currentEvents = useMemo(() => {
    return debugEvents.slice(0, historyIndex + 1);
  }, [debugEvents, historyIndex]);

  const messages = useMemo(() => {
    const msgs: Message[] = [];
    currentEvents.forEach(event => {
      if (event.type === 'request' && event.source === 'frontend' && event.data?.content) {
        msgs.push({ 
          id: event.id, 
          role: 'user', 
          content: event.data.content, 
          timestamp: event.timestamp 
        });
      } else if (event.type === 'response' && event.source === 'llm' && event.data?.message) {
        msgs.push({
          id: event.id,
          role: 'assistant',
          content: event.data.message.content || '',
          timestamp: event.timestamp,
          uiComponents: [],
          usage: event.data.usage
        });
      } else if (event.type === 'tool_call' && event.source === 'llm' && event.data?.component) {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.uiComponents = [...(lastMsg.uiComponents || []), event.data.component];
        }
      } else if (event.type === 'thought' && event.source === 'llm' && event.data?.reasoning) {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.reasoning = event.data.reasoning;
        }
      }
    });
    return msgs;
  }, [currentEvents]);

  const handleSaveConfig = async (newConfig: Config) => {
    await storageService.saveConfig(newConfig);
    openRouterService.configure(newConfig);
    setConfigured(true);
    try {
      const models = await openRouterService.getModels();
      setAvailableModels(models);
    } catch (e) {
      console.error('Erreur chargement modèles:', e);
    }
  };

  const handleSelectConversation = async (id: string) => {
    const loadedEvents = await storageService.getConversation(id);
    setDebugEvents(loadedEvents);
    setHistoryIndex(loadedEvents.length - 1);
    setCurrentConversationId(id);
    setActiveTab('chat');
    addDebugEvent({
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'request',
      source: 'frontend',
      data: { id, eventCount: loadedEvents.length },
      description: 'Conversation chargée depuis l\'historique',
    });
  };

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    const currentConfig = await storageService.getConfig();
    if (currentConfig) {
      const updatedConfig = { ...currentConfig, model: newModel };
      await storageService.saveConfig(updatedConfig);
      openRouterService.configure(updatedConfig);
      addDebugEvent({
        id: uuidv4(),
        timestamp: Date.now(),
        type: 'request',
        source: 'frontend',
        data: { model: newModel },
        description: `Modèle changé pour : ${newModel}`,
      });
    }
  };

  const handleSendMessage = async (content: string) => {
    setLoading(true);

    // If we are back in time, we "branch" or just clear future events
    const baseEvents = debugEvents.slice(0, historyIndex + 1);

    const userEvent: DebugEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'request',
      source: 'frontend',
      data: { content },
      description: 'Message utilisateur sauvegardé',
    };

    const nextEvents = [...baseEvents, userEvent];
    setDebugEvents(nextEvents);
    setHistoryIndex(nextEvents.length - 1);
    await storageService.saveConversation(currentConversationId, nextEvents);

    try {
      // Reconstruct messages for LLM context from current state
      const contextMessages = messages.concat([{ id: userEvent.id, role: 'user', content, timestamp: userEvent.timestamp }]);
      
      await openRouterService.chat(
        contextMessages,
        {}, 
        addDebugEvent
      );
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = async () => {
    const newId = uuidv4();
    setCurrentConversationId(newId);
    setDebugEvents([]);
    setHistoryIndex(-1);
    setActiveTab('chat');
    addDebugEvent({
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'request',
      source: 'frontend',
      data: { newId },
      description: 'Nouvelle conversation démarrée',
    });
  };

  if (!configured) {
    return <ConfigForm onSave={handleSaveConfig} />;
  }

  return (
    <div style={styles.container}>
      {/* Colonne 1 : Chat et Contrôle */}
      <div style={styles.chatPanel}>
        <div style={styles.header}>
          <h2 style={styles.title}>🤖 Autobot</h2>
          <div style={styles.actions}>
            <button onClick={handleResetChat} style={styles.secondaryButton}>+ Nouveau</button>
            <button onClick={() => setConfigured(false)} style={styles.secondaryButton}>⚙️</button>
          </div>
        </div>

        <div style={styles.tabBar}>
          <button 
            onClick={() => setActiveTab('chat')} 
            style={{...styles.tabButton, borderBottom: activeTab === 'chat' ? '2px solid #4f46e5' : 'none', color: activeTab === 'chat' ? '#4f46e5' : '#6b7280'}}
          >
            💬 Chat
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            style={{...styles.tabButton, borderBottom: activeTab === 'history' ? '2px solid #4f46e5' : 'none', color: activeTab === 'history' ? '#4f46e5' : '#6b7280'}}
          >
            📜 Histoire
          </button>
          <button 
            onClick={() => setActiveTab('db')} 
            style={{...styles.tabButton, borderBottom: activeTab === 'db' ? '2px solid #4f46e5' : 'none', color: activeTab === 'db' ? '#4f46e5' : '#6b7280'}}
          >
            📦 DB
          </button>
        </div>

        <div style={styles.leftContent}>
          {activeTab === 'chat' && (
            <div style={styles.tabContent}>
              <div style={styles.modelSelectorBar}>
                <label style={styles.modelLabel}>Modèle :</label>
                <select 
                  value={selectedModel} 
                  onChange={(e) => handleModelChange(e.target.value)}
                  style={styles.modelSelect}
                >
                  {availableModels.length > 0 ? (
                    availableModels.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id)).map(m => (
                      <option key={m.id} value={m.id}>{m.name || m.id}</option>
                    ))
                  ) : (
                    <option value={selectedModel}>{selectedModel} (chargement...)</option>
                  )}
                </select>
              </div>
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                loading={loading}
              />
            </div>
          )}
          {activeTab === 'history' && (
            <div style={styles.tabContent}>
              <ConversationsPanel 
                onSelect={handleSelectConversation}
                currentId={currentConversationId}
              />
            </div>
          )}
          {activeTab === 'db' && (
            <div style={styles.tabContent}>
              <DatabasePanel />
            </div>
          )}
        </div>
      </div>

      {/* Colonne 2 : Flow Visualizer + Time Travel */}
      <div style={styles.middlePanel}>
        <FlowPanel events={currentEvents} />
        
        {debugEvents.length > 0 && (
          <div style={styles.timeTravelBar}>
            <div style={styles.timeTravelHeader}>
              <span>🕰️ Voyage temporel : {historyIndex + 1} / {debugEvents.length} événements</span>
              <button 
                onClick={() => setHistoryIndex(debugEvents.length - 1)}
                style={styles.liveButton}
              >
                Go Live 🔴
              </button>
            </div>
            <input 
              type="range" 
              min="-1" 
              max={debugEvents.length - 1} 
              value={historyIndex} 
              onChange={(e) => setHistoryIndex(parseInt(e.target.value))}
              style={styles.slider}
            />
            <div style={styles.currentEventDesc}>
              {historyIndex >= 0 ? debugEvents[historyIndex].description : 'Début de la session'}
            </div>
          </div>
        )}
      </div>

      {/* Colonne 3 : JSON Logs / Debug */}
      <div style={styles.rightPanel}>
        <DebugPanel
          events={currentEvents}
          connected={true}
          onClear={() => {
            setDebugEvents([]);
            setHistoryIndex(-1);
            storageService.saveConversation(currentConversationId, []);
          }}
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
    backgroundColor: '#f9fafb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  chatPanel: {
    width: '35%',
    minWidth: '400px',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#ffffff',
  },
  middlePanel: {
    flex: 1,
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#ffffff',
  },
  rightPanel: {
    width: '25%',
    minWidth: '300px',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  tabBar: {
    display: 'flex',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  tabButton: {
    flex: 1,
    padding: '12px',
    fontSize: '13px',
    fontWeight: 600,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  leftContent: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  tabContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: 0,
  },
  modelSelectorBar: {
    padding: '12px 20px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  modelLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#4b5563',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  modelSelect: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    outline: 'none',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#f9fafb',
    }
  },
  timeTravelBar: {
    padding: '16px 20px',
    backgroundColor: '#f3f4f6',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  timeTravelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
  },
  liveButton: {
    padding: '4px 8px',
    fontSize: '11px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    cursor: 'pointer',
  },
  currentEventDesc: {
    fontSize: '12px',
    color: '#6b7280',
    fontStyle: 'italic',
  }
};

export default App;