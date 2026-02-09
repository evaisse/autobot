import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenRouterService } from '../services/OpenRouterService';

// Mock fetch
globalThis.fetch = vi.fn();

describe('OpenRouterService Frontend', () => {
  let service: OpenRouterService;

  beforeEach(() => {
    service = new OpenRouterService();
    service.configure({
      apiKey: 'test-key',
      apiEndpoint: 'https://openrouter.ai/api/v1',
      model: 'test-model',
    });
    vi.clearAllMocks();
  });

  it('should be configured correctly', () => {
    expect(service.isConfigured()).toBe(true);
  });

  it('should fetch models from OpenRouter', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: [{ id: 'model-1', name: 'Model 1' }]
      })
    });

    const models = await service.getModels();
    expect(models).toHaveLength(1);
    expect(models[0].id).toBe('model-1');
    expect(globalThis.fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models');
  });

  it('should send chat request and handle tool calls', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: 'res-1',
        choices: [{
          message: {
            content: 'Hello',
            role: 'assistant',
            tool_calls: [{
              function: {
                name: 'render_ui_component',
                arguments: JSON.stringify({ type: 'button', props: { label: 'Click me' } })
              }
            }]
          }
        }],
        usage: { total_tokens: 100 }
      })
    });

    const onDebugEvent = vi.fn();
    const result = await service.chat([{ id: '1', role: 'user', content: 'Hi', timestamp: 0 }], {}, onDebugEvent);

    expect(result.message.content).toBe('Hello');
    expect(result.message.uiComponents).toHaveLength(1);
    expect(result.message.uiComponents![0].type).toBe('button');
    
    // Check if debug events were emitted
    expect(onDebugEvent).toHaveBeenCalled();
    const eventTypes = onDebugEvent.mock.calls.map(call => call[0].type);
    expect(eventTypes).toContain('request');
    expect(eventTypes).toContain('response');
    expect(eventTypes).toContain('tool_call');
  });
});
