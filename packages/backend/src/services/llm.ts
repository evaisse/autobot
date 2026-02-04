import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { Message, DebugEvent, Config } from '../types';

/**
 * LLM Service
 * 
 * This service handles interactions with the OpenAI API and demonstrates
 * how the AG-UI protocol works with LLM backends.
 * 
 * It creates debug events for each step to help visualize the process.
 */

export class LLMService {
  private openai: OpenAI | null = null;
  private config: Config | null = null;

  /**
   * Configure the LLM service with API credentials
   */
  configure(config: Config): void {
    this.config = config;
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiEndpoint || undefined,
    });
  }

  /**
   * Check if the service is configured
   */
  isConfigured(): boolean {
    return this.openai !== null && this.config !== null;
  }

  /**
   * Send a chat message and collect debug events
   */
  async chat(messages: Message[]): Promise<{ message: Message; debugEvents: DebugEvent[] }> {
    if (!this.openai || !this.config) {
      throw new Error('LLM service not configured');
    }

    const debugEvents: DebugEvent[] = [];

    // Create debug event for the request
    debugEvents.push({
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'request',
      source: 'backend',
      data: { messages },
      description: 'Sending request to LLM',
    });

    try {
      // Define A2UI tools for the LLM
      const tools = [
        {
          type: 'function' as const,
          function: {
            name: 'render_ui_component',
            description: 'Render an interactive UI component (button, card, chart, list, form, table, progress bar, or alert) in the chat interface',
            parameters: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['button', 'card', 'list', 'chart', 'form', 'table', 'progress', 'alert'],
                  description: 'The type of UI component to render',
                },
                props: {
                  type: 'object',
                  description: 'Component-specific properties',
                },
              },
              required: ['type', 'props'],
            },
          },
        },
      ];

      // Call OpenAI API with tools
      const completion = await this.openai.chat.completions.create({
        model: this.config.model || 'gpt-3.5-turbo',
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        tools,
        tool_choice: 'auto',
        stream: false,
      });

      const choice = completion.choices[0];
      const uiComponents: any[] = [];

      // Handle tool calls (A2UI components)
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        for (const toolCall of choice.message.tool_calls) {
          if (toolCall.function.name === 'render_ui_component') {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              const component = {
                id: uuidv4(),
                type: args.type,
                props: args.props,
              };
              uiComponents.push(component);

              // Create debug event for UI component rendering
              debugEvents.push({
                id: uuidv4(),
                timestamp: Date.now(),
                type: 'tool_call',
                source: 'llm',
                data: { toolCall: toolCall.function.name, component },
                description: `LLM rendered ${args.type} component via A2UI`,
              });
            } catch (error) {
              console.error('Error parsing tool call:', error);
            }
          }
        }
      }

      // Create debug event for the response
      debugEvents.push({
        id: uuidv4(),
        timestamp: Date.now(),
        type: 'response',
        source: 'llm',
        data: { 
          usage: completion.usage,
          model: completion.model,
          toolCalls: choice.message.tool_calls?.length || 0,
        },
        description: `LLM responded (${completion.usage?.total_tokens || 0} tokens, ${choice.message.tool_calls?.length || 0} UI components)`,
      });

      const responseMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: choice.message.content || '',
        timestamp: Date.now(),
        uiComponents: uiComponents.length > 0 ? uiComponents : undefined,
      };

      return { message: responseMessage, debugEvents };
    } catch (error: any) {
      // Create debug event for errors
      debugEvents.push({
        id: uuidv4(),
        timestamp: Date.now(),
        type: 'error',
        source: 'llm',
        data: { error: error.message },
        description: `Error: ${error.message}`,
      });

      throw error;
    }
  }

  /**
   * Get available tools (for demonstration)
   */
  getAvailableTools(): any[] {
    return [
      {
        name: 'get_weather',
        description: 'Get the current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City name',
            },
          },
          required: ['location'],
        },
      },
    ];
  }
}

export const llmService = new LLMService();
