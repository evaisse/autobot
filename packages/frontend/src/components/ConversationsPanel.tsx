import { useState, useEffect } from 'react';
import { storageService } from '../services/StorageService';

interface ConversationsPanelProps {
  onSelect: (id: string) => void;
  currentId: string;
}

export function ConversationsPanel({ onSelect, currentId }: ConversationsPanelProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const list = await storageService.listConversations();
      // Trier par date de mise à jour décroissante
      setConversations(list.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [currentId]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Supprimer cette conversation ?')) {
      await storageService.deleteConversation(id);
      loadConversations();
    }
  };

  const getPreview = (conv: any) => {
    if (conv.events && conv.events.length > 0) {
      const userEvent = conv.events.find((e: any) => e.source === 'frontend' && e.type === 'request' && e.data?.content);
      if (userEvent) return userEvent.data.content.substring(0, 60) + (userEvent.data.content.length > 60 ? '...' : '');
    }
    if (conv.messages && conv.messages.length > 0) {
      const userMsg = conv.messages.find((m: any) => m.role === 'user');
      if (userMsg) return userMsg.content.substring(0, 60) + (userMsg.content.length > 60 ? '...' : '');
    }
    return 'Nouvelle conversation';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>📜 Historique</h3>
        <button onClick={loadConversations} style={styles.refreshBtn}>🔄</button>
      </div>

      <div style={styles.list}>
        {loading ? (
          <div style={styles.loading}>Chargement...</div>
        ) : conversations.length === 0 ? (
          <div style={styles.empty}>Aucun historique</div>
        ) : (
          conversations.map((conv) => (
            <div 
              key={conv.id} 
              onClick={() => onSelect(conv.id)}
              style={{
                ...styles.item,
                borderLeft: conv.id === currentId ? '4px solid #4f46e5' : '4px solid transparent',
                backgroundColor: conv.id === currentId ? '#f3f4f6' : 'transparent',
              }}
            >
              <div style={styles.itemContent}>
                <div style={styles.preview}>{getPreview(conv)}</div>
                <div style={styles.date}>{new Date(conv.updatedAt).toLocaleString()}</div>
              </div>
              <button onClick={(e) => handleDelete(e, conv.id)} style={styles.deleteBtn}>✕</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#fff',
    borderTop: '1px solid #e5e7eb',
  },
  header: {
    padding: '10px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    margin: 0,
    fontSize: '14px',
    color: '#374151',
  },
  refreshBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  },
  list: {
    flex: 1,
    overflowY: 'auto' as const,
  },
  item: {
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background-color 0.2s',
  },
  itemContent: {
    flex: 1,
    marginRight: '12px',
  },
  preview: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#111827',
    marginBottom: '4px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  date: {
    fontSize: '11px',
    color: '#6b7280',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '4px',
    fontSize: '16px',
    '&:hover': {
      color: '#ef4444',
    }
  },
  loading: {
    padding: '20px',
    textAlign: 'center' as const,
    color: '#9ca3af',
    fontSize: '13px',
  },
  empty: {
    padding: '40px 20px',
    textAlign: 'center' as const,
    color: '#9ca3af',
    fontSize: '13px',
  },
};
