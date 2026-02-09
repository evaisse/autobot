import { useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DebugEvent } from '../types';

interface FlowPanelProps {
  events: DebugEvent[];
}

const nodeDefaults = {
  style: {
    padding: '12px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    width: 160,
    textAlign: 'center' as const,
    border: '2px solid #374151',
    backgroundColor: '#1f2937',
    color: '#fff',
    transition: 'all 0.3s ease',
  },
};

const initialNodes: Node[] = [
  {
    id: 'user',
    data: { label: '🧑‍💻 Utilisateur (Front)' },
    position: { x: 50, y: 50 },
    ...nodeDefaults,
    style: { ...nodeDefaults.style, borderColor: '#9ca3af' },
  },
  {
    id: 'app',
    data: { label: '⚙️ Gateway (Analyse)' },
    position: { x: 300, y: 50 },
    ...nodeDefaults,
  },
  {
    id: 'llm',
    data: { label: '🤖 Modèle (LLM)' },
    position: { x: 550, y: 50 },
    ...nodeDefaults,
    style: { ...nodeDefaults.style, borderColor: '#3b82f6' },
  },
  {
    id: 'a2ui',
    data: { label: '🖌️ A2UI (Conversion)' },
    position: { x: 300, y: 200 },
    ...nodeDefaults,
    style: { ...nodeDefaults.style, borderColor: '#f59e0b' },
  },
  {
    id: 'ui',
    data: { label: '🎨 Rendu Final' },
    position: { x: 50, y: 200 },
    ...nodeDefaults,
    style: { ...nodeDefaults.style, borderColor: '#10b981' },
  },
];

const initialEdges: Edge[] = [
  { 
    id: 'e-user-app', 
    source: 'user', 
    target: 'app', 
    animated: false, 
    label: 'Message',
    style: { stroke: '#374151' },
    labelStyle: { fill: '#9ca3af', fontSize: 10 }
  },
  { 
    id: 'e-app-llm', 
    source: 'app', 
    target: 'llm', 
    animated: false, 
    label: 'Prompt + Tools',
    style: { stroke: '#374151' },
    labelStyle: { fill: '#9ca3af', fontSize: 10 }
  },
  { 
    id: 'e-llm-app', 
    source: 'llm', 
    target: 'app', 
    animated: false, 
    label: 'Réponse brute',
    style: { stroke: '#374151' },
    labelStyle: { fill: '#9ca3af', fontSize: 10 }
  },
  { 
    id: 'e-app-a2ui', 
    source: 'app', 
    target: 'a2ui', 
    animated: false, 
    label: 'Extraction Tools',
    style: { stroke: '#374151' },
    labelStyle: { fill: '#9ca3af', fontSize: 10 }
  },
  { 
    id: 'e-a2ui-ui', 
    source: 'a2ui', 
    target: 'ui', 
    animated: false, 
    label: 'Composants React',
    style: { stroke: '#374151' },
    labelStyle: { fill: '#9ca3af', fontSize: 10 }
  },
];

export function FlowPanel({ events }: FlowPanelProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (events.length === 0) {
        // Reset state
        setEdges(initialEdges);
        setNodes(initialNodes);
        return;
    }

    const lastEvent = events[events.length - 1];
    let activeEdgeId = '';
    let activeNodeId = '';

    // Mapping events to flow
    if (lastEvent.source === 'frontend' && lastEvent.type === 'request' && lastEvent.description.includes('sauvegardé')) {
        activeEdgeId = 'e-user-app';
        activeNodeId = 'user';
    } else if (lastEvent.source === 'frontend' && lastEvent.description.includes('OpenRouter')) {
        activeEdgeId = 'e-app-llm';
        activeNodeId = 'app';
    } else if (lastEvent.source === 'llm' && lastEvent.type === 'thought') {
        activeNodeId = 'llm';
    } else if (lastEvent.source === 'llm' && lastEvent.type === 'response') {
        activeEdgeId = 'e-llm-app';
        activeNodeId = 'llm';
    } else if (lastEvent.source === 'llm' && lastEvent.type === 'tool_call') {
        activeEdgeId = 'e-app-a2ui';
        activeNodeId = 'a2ui';
    }

    // Secondary animation for final rendering if we have tool calls in previous events
    const hasToolCalls = events.slice(-5).some(e => e.type === 'tool_call');
    if (lastEvent.type === 'response' && hasToolCalls) {
        // We could chain animations but for simplicity let's highlight UI if response arrives after tools
        activeEdgeId = 'e-a2ui-ui';
    }

    setEdges((eds) => 
      eds.map((e) => {
        const isActive = e.id === activeEdgeId;
        return {
          ...e,
          animated: isActive,
          style: { 
            ...e.style, 
            stroke: isActive ? '#60a5fa' : '#374151', 
            strokeWidth: isActive ? 3 : 1 
          },
        };
      })
    );

    setNodes((nds) => 
      nds.map((n) => {
        const isActive = n.id === activeNodeId;
        let baseBorderColor = (initialNodes.find(inNode => inNode.id === n.id)?.style as any)?.borderColor || '#374151';
        
        return {
          ...n,
          style: { 
            ...n.style, 
            backgroundColor: isActive ? '#374151' : '#1f2937',
            borderColor: isActive ? '#60a5fa' : baseBorderColor,
            boxShadow: isActive ? '0 0 15px rgba(96, 165, 250, 0.4)' : 'none',
            transform: isActive ? 'scale(1.05)' : 'scale(1)',
          }
        };
      })
    );

  }, [events, setEdges, setNodes]);

  return (
    <div style={{ height: '100%', width: '100%', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e293b', color: '#f8fafc', fontWeight: 'bold', fontSize: '14px' }}>
        🔄 Flow Visualizer (Real-time)
      </div>
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background color="#1e293b" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
