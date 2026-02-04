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
      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: this.config.model || 'gpt-3.5-turbo',
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: false,
      });

      // Create debug event for the response
      debugEvents.push({
        id: uuidv4(),
        timestamp: Date.now(),
        type: 'response',
        source: 'llm',
        data: { 
          usage: completion.usage,
          model: completion.model,
        },
        description: `LLM responded (${completion.usage?.total_tokens || 0} tokens)`,
      });

      const responseMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: completion.choices[0].message.content || '',
        timestamp: Date.now(),
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
