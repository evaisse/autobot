import { useState, useRef, useEffect } from 'react';
import { Message } from '../types';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  loading: boolean;
}

/**
 * Chat Panel Component
 * 
 * The main chat interface where users interact with the LLM.
 * Shows conversation history and allows sending new messages.
 */
export function ChatPanel({ messages, onSendMessage, loading }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const message = input.trim();
    setInput('');
    await onSendMessage(message);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>💬 Chat with LLM</h2>
        <p style={styles.subtitle}>
          Ask anything and watch the debug panel to see how it works
        </p>
      </div>

      <div style={styles.messageList}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🤖</div>
            <h3 style={styles.emptyTitle}>Ready to chat!</h3>
            <p style={styles.emptyText}>
              Send a message to start a conversation with your LLM.
              You'll see all the technical details in the debug panel on the left.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                ...styles.message,
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  ...styles.messageContent,
                  backgroundColor: message.role === 'user' ? '#007bff' : '#f1f3f5',
                  color: message.role === 'user' ? 'white' : '#333',
                }}
              >
                <div style={styles.messageRole}>
                  {message.role === 'user' ? '👤 You' : '🤖 Assistant'}
                </div>
                <div style={styles.messageText}>{message.content}</div>
                <div style={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div style={{ ...styles.message, alignSelf: 'flex-start' }}>
            <div style={{
              ...styles.messageContent,
              backgroundColor: '#f1f3f5',
            }}>
              <div style={styles.loadingDots}>
                <span>●</span>
                <span>●</span>
                <span>●</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} style={styles.inputForm}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          style={styles.input}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            ...styles.sendButton,
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
        >
          {loading ? '⏳' : '📤'} Send
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: 'white',
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    margin: '0 0 5px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#6b7280',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center' as const,
    padding: '40px',
    color: '#6b7280',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  emptyTitle: {
    margin: '0 0 10px 0',
    fontSize: '24px',
    color: '#333',
  },
  emptyText: {
    margin: 0,
    fontSize: '14px',
    maxWidth: '400px',
    lineHeight: '1.6',
  },
  message: {
    display: 'flex',
    maxWidth: '70%',
  },
  messageContent: {
    padding: '12px 16px',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  messageRole: {
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '6px',
    opacity: 0.8,
  },
  messageText: {
    fontSize: '15px',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap' as const,
  },
  messageTime: {
    fontSize: '11px',
    marginTop: '6px',
    opacity: 0.6,
  },
  loadingDots: {
    display: 'flex',
    gap: '4px',
    fontSize: '20px',
    color: '#6b7280',
    animation: 'pulse 1.5s infinite',
  },
  inputForm: {
    display: 'flex',
    gap: '10px',
    padding: '20px',
    borderTop: '1px solid #e5e7eb',
  },
  input: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
  },
  sendButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
