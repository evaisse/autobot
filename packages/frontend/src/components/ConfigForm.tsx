import { useState } from 'react';
import { Config } from '../types';

interface ConfigFormProps {
  onSave: (config: Config) => Promise<void>;
}

/**
 * Configuration Form Component
 * 
 * Allows users to input their OpenAI API credentials and endpoint.
 * This is the entry point before the chatbot can be used.
 */
export function ConfigForm({ onSave }: ConfigFormProps) {
  const [apiEndpoint, setApiEndpoint] = useState('https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [azureApiVersion, setAzureApiVersion] = useState('');
  const [azureDeployment, setAzureDeployment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSave({
        apiEndpoint,
        apiKey,
        model,
        azureApiVersion: azureApiVersion || undefined,
        azureDeployment: azureDeployment || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🤖 Autobot Configuration</h1>
        <p style={styles.subtitle}>
          Configure your OpenAI API credentials to start chatting
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>API Endpoint</label>
            <input
              type="text"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              style={styles.input}
              placeholder="https://api.openai.com/v1"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={styles.input}
              placeholder="sk-..."
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Model (optional)</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={styles.input}
              placeholder="gpt-3.5-turbo"
            />
          </div>

          <div style={styles.azureSection}>
            <div style={styles.azureHeader}>Azure OpenAI (optional)</div>
            <div style={styles.field}>
              <label style={styles.label}>API Version</label>
              <input
                type="text"
                value={azureApiVersion}
                onChange={(e) => setAzureApiVersion(e.target.value)}
                style={styles.input}
                placeholder="2024-02-15-preview"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Deployment Name</label>
              <input
                type="text"
                value={azureDeployment}
                onChange={(e) => setAzureDeployment(e.target.value)}
                style={styles.input}
                placeholder="my-deployment"
              />
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>

        <div style={styles.info}>
          <p><strong>Note:</strong> Your API key is stored locally and never sent to any third party except OpenAI.</p>
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
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '28px',
    color: '#333',
  },
  subtitle: {
    margin: '0 0 30px 0',
    color: '#666',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  azureSection: {
    border: '1px dashed #e5e7eb',
    borderRadius: '6px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    backgroundColor: '#f9fafb',
  },
  azureHeader: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none',
  },
  button: {
    padding: '12px',
    fontSize: '16px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  error: {
    padding: '10px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '4px',
    fontSize: '14px',
  },
  info: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#666',
  },
};
