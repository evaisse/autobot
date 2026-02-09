import { useState } from 'react';
import { Config } from '../types';

interface ConfigFormProps {
  onSave: (config: Config) => Promise<void>;
}

export function ConfigForm({ onSave }: ConfigFormProps) {
  const [apiKey, setApiKey] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('https://openrouter.ai/api/v1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSave({
        apiEndpoint,
        apiKey,
        model: 'google/gemini-2.0-flash-001', // Modèle par défaut pour démarrer
        siteUrl: window.location.origin,
        siteName: 'Autobot Demo',
        includeReasoning: true,
        webSearch: false,
      });
    } catch (err: any) {
      setError(err.message || 'Échec de la configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.icon}>🚀</span>
          <h1 style={styles.title}>Configuration OpenRouter</h1>
        </div>
        
        <p style={styles.subtitle}>
          Entrez votre clé API pour commencer la démonstration multi-modale.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Clé API OpenRouter</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={styles.input}
              placeholder="sk-or-v1-..."
              required
              autoFocus
            />
            <div style={styles.hint}>
              Retrouvez vos clés sur <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={styles.link}>openrouter.ai</a>
            </div>
          </div>

          <div style={styles.advancedToggle} onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? '▼ Masquer les options' : '▶ Options avancées (Endpoint)'}
          </div>

          {showAdvanced && (
            <div style={styles.field}>
              <label style={styles.label}>API Endpoint URL</label>
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                style={styles.input}
                placeholder="https://openrouter.ai/api/v1"
              />
            </div>
          )}

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading || !apiKey} style={styles.button}>
            {loading ? 'Connexion...' : 'Démarrer'}
          </button>
        </form>

        <div style={styles.footer}>
          Les données sont stockées localement dans votre navigateur (IndexedDB).
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  icon: {
    fontSize: '28px',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    margin: '0 0 24px 0',
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    padding: '12px 14px',
    fontSize: '15px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#f9fafb',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '&:focus': {
      borderColor: '#4f46e5',
      boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)',
    }
  },
  hint: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  link: {
    color: '#4f46e5',
    textDecoration: 'none',
    fontWeight: '500',
  },
  advancedToggle: {
    fontSize: '12px',
    color: '#6b7280',
    cursor: 'pointer',
    userSelect: 'none' as const,
    '&:hover': {
      color: '#374151',
    }
  },
  button: {
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#4f46e5',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '8px',
  },
  error: {
    padding: '12px',
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    borderRadius: '8px',
    fontSize: '13px',
    border: '1px solid #fecaca',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center' as const,
    fontSize: '11px',
    color: '#9ca3af',
  },
};
