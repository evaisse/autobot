import { DebugEvent } from '../types';

interface DebugPanelProps {
  events: DebugEvent[];
  connected: boolean;
  onClear: () => void;
}

/**
 * Debug Panel Component
 * 
 * Displays real-time debug events showing the communication between
 * frontend, backend, and LLM. This helps visualize the AG-UI protocol.
 */
export function DebugPanel({ events, connected, onClear }: DebugPanelProps) {
  const getEventColor = (event: DebugEvent) => {
    switch (event.type) {
      case 'request': return '#3b82f6';
      case 'response': return '#10b981';
      case 'tool_call': return '#f59e0b';
      case 'thought': return '#8b5cf6';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'frontend': return '🖥️';
      case 'backend': return '⚙️';
      case 'llm': return '🤖';
      default: return '📡';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <h2 style={styles.title}>🔍 Debug Events</h2>
          <div style={styles.status}>
            <span style={{
              ...styles.statusDot,
              backgroundColor: connected ? '#10b981' : '#ef4444'
            }} />
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        <button onClick={onClear} style={styles.clearButton}>
          Clear Events
        </button>
      </div>

      <div style={styles.eventList}>
        {events.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No debug events yet.</p>
            <p style={styles.emptyHint}>
              Start chatting to see real-time communication between components
            </p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} style={styles.event}>
              <div style={styles.eventHeader}>
                <span style={styles.eventIcon}>
                  {getSourceIcon(event.source)}
                </span>
                <span style={{
                  ...styles.eventType,
                  backgroundColor: getEventColor(event) + '20',
                  color: getEventColor(event),
                }}>
                  {event.type}
                </span>
                <span style={styles.eventTime}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div style={styles.eventDescription}>
                {event.description}
              </div>
              {event.data && (
                <details style={styles.eventData}>
                  <summary style={styles.dataSummary}>View data</summary>
                  <pre style={styles.dataContent}>
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: '#1f2937',
    color: 'white',
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #374151',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#9ca3af',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  clearButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#374151',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  eventList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  emptyState: {
    textAlign: 'center' as const,
    color: '#9ca3af',
    padding: '40px 20px',
  },
  emptyHint: {
    fontSize: '14px',
    marginTop: '10px',
  },
  event: {
    backgroundColor: '#374151',
    borderRadius: '6px',
    padding: '12px',
    fontSize: '14px',
  },
  eventHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  eventIcon: {
    fontSize: '16px',
  },
  eventType: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'uppercase' as const,
  },
  eventTime: {
    marginLeft: 'auto',
    fontSize: '12px',
    color: '#9ca3af',
  },
  eventDescription: {
    color: '#e5e7eb',
    lineHeight: '1.5',
  },
  eventData: {
    marginTop: '8px',
    fontSize: '12px',
  },
  dataSummary: {
    cursor: 'pointer',
    color: '#60a5fa',
    marginBottom: '8px',
  },
  dataContent: {
    backgroundColor: '#1f2937',
    padding: '8px',
    borderRadius: '4px',
    overflow: 'auto',
    color: '#d1d5db',
    fontSize: '11px',
  },
};
