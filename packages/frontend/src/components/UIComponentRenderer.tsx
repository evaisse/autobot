import { UIComponent } from '../types';

interface UIComponentRendererProps {
  component: UIComponent;
}

/**
 * A2UI Component Renderer
 * 
 * Renders UI components dynamically created by the LLM using the A2UI protocol.
 * Supports buttons, cards, lists, charts, forms, tables, progress bars, and alerts.
 */
export function UIComponentRenderer({ component }: UIComponentRendererProps) {
  const { type, props } = component;

  switch (type) {
    case 'button':
      return (
        <button
          style={{
            ...styles.button,
            ...(props.variant === 'primary' ? styles.buttonPrimary :
                props.variant === 'danger' ? styles.buttonDanger :
                styles.buttonSecondary),
          }}
          onClick={() => alert(`Action: ${props.action || 'No action defined'}`)}
        >
          {props.label}
        </button>
      );

    case 'card':
      return (
        <div style={styles.card}>
          {props.imageUrl && (
            <img src={props.imageUrl} alt={props.title} style={styles.cardImage} />
          )}
          <div style={styles.cardContent}>
            <h3 style={styles.cardTitle}>{props.title}</h3>
            {props.description && (
              <p style={styles.cardDescription}>{props.description}</p>
            )}
            {props.actions && props.actions.length > 0 && (
              <div style={styles.cardActions}>
                {props.actions.map((action: any, idx: number) => (
                  <button
                    key={idx}
                    style={styles.cardButton}
                    onClick={() => alert(`Action: ${action.action}`)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );

    case 'list':
      const ListTag = props.ordered ? 'ol' : 'ul';
      return (
        <ListTag style={styles.list}>
          {props.items.map((item: any, idx: number) => (
            <li key={idx} style={styles.listItem}>
              {item.icon && <span style={styles.listIcon}>{item.icon}</span>}
              <span style={styles.listLabel}>{item.label}</span>
              {item.value && <span style={styles.listValue}>{item.value}</span>}
            </li>
          ))}
        </ListTag>
      );

    case 'chart':
      return (
        <div style={styles.chart}>
          <h4 style={styles.chartTitle}>{props.title}</h4>
          <div style={styles.chartBars}>
            {props.data.map((item: any, idx: number) => {
              const maxValue = Math.max(...props.data.map((d: any) => d.value));
              const percentage = (item.value / maxValue) * 100;
              return (
                <div key={idx} style={styles.chartBarContainer}>
                  <div style={styles.chartLabel}>{item.label}</div>
                  <div style={styles.chartBarWrapper}>
                    <div
                      style={{
                        ...styles.chartBar,
                        width: `${percentage}%`,
                      }}
                    />
                    <span style={styles.chartValue}>{item.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'form':
      return (
        <div style={styles.form}>
          <h4 style={styles.formTitle}>{props.title}</h4>
          {props.fields.map((field: any, idx: number) => {
            // Validate field type against safe allowlist
            const safeTypes = ['text', 'email', 'password', 'number', 'tel', 'url', 'date', 'time'];
            const fieldType = safeTypes.includes(field.type) ? field.type : 'text';
            
            return (
              <div key={idx} style={styles.formField}>
                <label style={styles.formLabel}>
                  {field.label}
                  {field.required && <span style={styles.formRequired}>*</span>}
                </label>
                <input
                  type={fieldType}
                  name={field.name}
                  style={styles.formInput}
                  placeholder={field.placeholder}
                />
              </div>
            );
          })}
          <button style={styles.formSubmit}>
            {props.submitLabel || 'Submit'}
          </button>
        </div>
      );

    case 'table':
      return (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                {props.headers.map((header: string, idx: number) => (
                  <th key={idx} style={styles.tableHeader}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {props.rows.map((row: any, rowIdx: number) => (
                <tr key={rowIdx} style={styles.tableRow}>
                  {props.headers.map((header: string, colIdx: number) => (
                    <td key={colIdx} style={styles.tableCell}>
                      {row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'progress':
      const percentage = Math.min((props.value / props.max) * 100, 100);
      return (
        <div style={styles.progressContainer}>
          {props.label && <div style={styles.progressLabel}>{props.label}</div>}
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${percentage}%`,
              }}
            />
          </div>
          <div style={styles.progressText}>
            {props.value} / {props.max} ({percentage.toFixed(0)}%)
          </div>
        </div>
      );

    case 'alert':
      const severityColors = {
        info: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      };
      return (
        <div
          style={{
            ...styles.alert,
            borderLeftColor: severityColors[props.severity as keyof typeof severityColors] || severityColors.info,
          }}
        >
          {props.title && <div style={styles.alertTitle}>{props.title}</div>}
          <div style={styles.alertMessage}>{props.message}</div>
        </div>
      );

    default:
      return (
        <div style={styles.unknown}>
          Unknown component type: {type}
        </div>
      );
  }
}

const styles = {
  // Button styles
  button: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    margin: '4px',
  },
  buttonPrimary: {
    backgroundColor: '#007bff',
    color: 'white',
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
    color: 'white',
  },
  buttonDanger: {
    backgroundColor: '#dc3545',
    color: 'white',
  },

  // Card styles
  card: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    marginTop: '8px',
    marginBottom: '8px',
  },
  cardImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover' as const,
  },
  cardContent: {
    padding: '16px',
  },
  cardTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: '600',
  },
  cardDescription: {
    margin: '0 0 12px 0',
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
  },
  cardButton: {
    padding: '6px 12px',
    fontSize: '13px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  // List styles
  list: {
    listStyle: 'none',
    padding: '0',
    margin: '8px 0',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    marginBottom: '4px',
  },
  listIcon: {
    marginRight: '8px',
    fontSize: '18px',
  },
  listLabel: {
    flex: 1,
    fontSize: '14px',
  },
  listValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },

  // Chart styles
  chart: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '8px',
    marginBottom: '8px',
  },
  chartTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: '600',
  },
  chartBars: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  chartBarContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  chartLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
  },
  chartBarWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  chartBar: {
    height: '24px',
    backgroundColor: '#3b82f6',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  chartValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    minWidth: '40px',
  },

  // Form styles
  form: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '8px',
    marginBottom: '8px',
  },
  formTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: '600',
  },
  formField: {
    marginBottom: '12px',
  },
  formLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '4px',
    color: '#374151',
  },
  formRequired: {
    color: '#ef4444',
    marginLeft: '2px',
  },
  formInput: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    outline: 'none',
  },
  formSubmit: {
    marginTop: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  // Table styles
  tableContainer: {
    overflowX: 'auto' as const,
    marginTop: '8px',
    marginBottom: '8px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '14px',
  },
  tableHeader: {
    padding: '12px',
    textAlign: 'left' as const,
    fontWeight: '600',
    backgroundColor: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
  },
  tableRow: {
    borderBottom: '1px solid #e5e7eb',
  },
  tableCell: {
    padding: '12px',
  },

  // Progress styles
  progressContainer: {
    marginTop: '8px',
    marginBottom: '8px',
  },
  progressLabel: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '6px',
    color: '#374151',
  },
  progressBar: {
    width: '100%',
    height: '20px',
    backgroundColor: '#e5e7eb',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },

  // Alert styles
  alert: {
    padding: '12px 16px',
    borderLeft: '4px solid',
    borderRadius: '4px',
    backgroundColor: '#f9fafb',
    marginTop: '8px',
    marginBottom: '8px',
  },
  alertTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '4px',
    color: '#1f2937',
  },
  alertMessage: {
    fontSize: '14px',
    color: '#4b5563',
  },

  // Unknown component
  unknown: {
    padding: '12px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '4px',
    fontSize: '14px',
    marginTop: '8px',
    marginBottom: '8px',
  },
};
