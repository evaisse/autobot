import { CapabilitiesResponse, CapabilityResult } from '../types';

interface CapabilitiesPanelProps {
  data: CapabilitiesResponse | null;
  loading: boolean;
  error: string;
  onRun: () => void;
}

function statusColor(status: CapabilityResult['status']): string {
  switch (status) {
    case 'supported':
      return '#10b981';
    case 'unsupported':
      return '#f59e0b';
    case 'error':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

/**
 * Capabilities Panel Component
 *
 * Shows the results of the Azure OpenAI capabilities probe.
 */
export function CapabilitiesPanel({ data, loading, error, onRun }: CapabilitiesPanelProps) {
  const hasResults = Boolean(data?.results && data.results.length > 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>🧪 Capabilities</h2>
          <div style={styles.subtitle}>
            Azure OpenAI probe for tool calling, streaming, vision, and reasoning.
          </div>
        </div>
        <button style={styles.button} onClick={onRun} disabled={loading}>
          {loading ? 'Probing...' : 'Run Probe'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {data && (
        <div style={styles.meta}>
          <div>Endpoint: <span style={styles.metaValue}>{data.endpoint || 'n/a'}</span></div>
          <div>Deployment: <span style={styles.metaValue}>{data.deployment || 'n/a'}</span></div>
          <div>API Version: <span style={styles.metaValue}>{data.apiVersion || 'n/a'}</span></div>
        </div>
      )}

      {!hasResults && !error && (
        <div style={styles.empty}>
          {data?.azure === false
            ? 'Configure an Azure OpenAI endpoint to run the probe.'
            : 'Run the probe to see which features are supported.'}
        </div>
      )}

      {hasResults && (
        <div style={styles.results}>
          {data!.results.map((result) => (
            <div key={result.name} style={styles.resultRow}>
              <div style={styles.resultName}>{result.name}</div>
              <div style={{ ...styles.resultStatus, color: statusColor(result.status) }}>
                {result.status}
              </div>
              <div style={styles.resultDetails}>
                {result.details || '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '16px 20px',
    borderBottom: '1px solid #374151',
    backgroundColor: '#111827',
    color: '#e5e7eb',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
  },
  subtitle: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px',
    maxWidth: '320px',
    lineHeight: 1.4,
  },
  button: {
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: '#1f2937',
    color: '#e5e7eb',
    border: '1px solid #374151',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  error: {
    marginTop: '12px',
    padding: '10px',
    borderRadius: '6px',
    backgroundColor: '#3f1d1d',
    color: '#fecaca',
    fontSize: '12px',
  },
  meta: {
    marginTop: '12px',
    fontSize: '12px',
    color: '#9ca3af',
    display: 'grid',
    gap: '4px',
  },
  metaValue: {
    color: '#e5e7eb',
  },
  empty: {
    marginTop: '12px',
    fontSize: '12px',
    color: '#9ca3af',
  },
  results: {
    marginTop: '12px',
    display: 'grid',
    gap: '8px',
  },
  resultRow: {
    display: 'grid',
    gridTemplateColumns: '120px 90px 1fr',
    gap: '10px',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '12px',
  },
  resultName: {
    fontWeight: 600,
    textTransform: 'capitalize' as const,
  },
  resultStatus: {
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    fontSize: '11px',
  },
  resultDetails: {
    color: '#d1d5db',
  },
};
