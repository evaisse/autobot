import { useState, useEffect } from 'react';
import { storageService } from '../services/StorageService';

export function DatabasePanel() {
  const [activeStore, setActiveStore] = useState<'config' | 'conversations'>('conversations');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    try {
      const rawData = await storageService.getRawData(activeStore);
      setData(rawData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [activeStore]);

  const handleDelete = async (id: string) => {
    if (activeStore === 'conversations') {
      await storageService.deleteConversation(id);
      refreshData();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>📦 IndexedDB Explorer</h3>
        <button onClick={refreshData} style={styles.refreshBtn}>🔄</button>
      </div>
      
      <div style={styles.tabs}>
        <button 
          onClick={() => setActiveStore('conversations')}
          style={{...styles.tab, borderBottom: activeStore === 'conversations' ? '2px solid #4f46e5' : 'none'}}
        >
          Conversations
        </button>
        <button 
          onClick={() => setActiveStore('config')}
          style={{...styles.tab, borderBottom: activeStore === 'config' ? '2px solid #4f46e5' : 'none'}}
        >
          Config
        </button>
      </div>

      <div style={styles.content}>
        {loading ? (
          <div style={styles.loading}>Chargement...</div>
        ) : data.length === 0 ? (
          <div style={styles.empty}>Aucune donnée</div>
        ) : (
          <div style={styles.list}>
            {data.map((item, i) => (
              <div key={item.id || i} style={styles.item}>
                <div style={styles.itemHeader}>
                  <span style={styles.itemId}>{item.id || 'N/A'}</span>
                  {activeStore === 'conversations' && (
                    <button onClick={() => handleDelete(item.id)} style={styles.deleteBtn}>🗑️</button>
                  )}
                </div>
                <pre style={styles.json}>{JSON.stringify(item, null, 2)}</pre>
              </div>
            ))}
          </div>
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
    fontSize: '12px',
    borderTop: '1px solid #e5e7eb',
  },
  header: {
    padding: '10px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
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
    padding: '4px',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    padding: '8px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '12px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  item: {
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    padding: '8px',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  itemId: {
    fontWeight: 'bold',
    color: '#6b7280',
    fontSize: '10px',
  },
  json: {
    margin: 0,
    fontSize: '10px',
    whiteSpace: 'pre-wrap' as const,
    backgroundColor: '#f3f4f6',
    padding: '8px',
    borderRadius: '4px',
    maxHeight: '150px',
    overflowY: 'auto' as const,
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '20px',
    color: '#9ca3af',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '20px',
    color: '#9ca3af',
  },
};
