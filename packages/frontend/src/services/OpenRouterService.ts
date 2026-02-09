import { v4 as uuidv4 } from 'uuid';
import { Message, Config, DebugEvent, OpenRouterModel, OpenRouterParameters } from '../types';

/**
 * OpenRouter Service (Frontend Version)
 * 
 * Ce service gère les interactions avec l'API OpenRouter directement depuis le navigateur.
 * Il émet également des événements de debug pour le panneau technique.
 */
export class OpenRouterService {
  private config: Config | null = null;

  configure(config: Config): void {
    this.config = config;
  }

  isConfigured(): boolean {
    return this.config !== null && !!this.config.apiKey;
  }

  /**
   * Liste les modèles disponibles via OpenRouter
   */
  async getModels(): Promise<OpenRouterModel[]> {
    const endpoint = this.config?.apiEndpoint || 'https://openrouter.ai/api/v1';
    const response = await fetch(`${endpoint}/models`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des modèles');
    const data = await response.json();
    return data.data as OpenRouterModel[];
  }

  /**
   * Envoie une requête de chat à OpenRouter
   */
  async chat(
    messages: Message[],
    params: OpenRouterParameters = {},
    onDebugEvent: (event: DebugEvent) => void
  ): Promise<{ message: Message }> {
    if (!this.config || !this.config.apiKey) {
      throw new Error('Service OpenRouter non configuré');
    }

    // Préparation de la requête
    const requestPayload = {
      model: this.config.model || 'google/gemini-2.0-flash-001',
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      ...params,
      include_reasoning: params.include_reasoning ?? this.config.includeReasoning,
      // A2UI Tools (Toujours inclus pour la démo)
      tools: [
        {
          type: 'function',
          function: {
            name: 'render_ui_component',
            description: 'Render an interactive UI component (button, card, chart, list, form, table, progress bar, or alert)',
            parameters: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['button', 'card', 'list', 'chart', 'form', 'table', 'progress', 'alert'],
                },
                props: { type: 'object' },
              },
              required: ['type', 'props'],
            },
          },
        }
      ],
      tool_choice: 'auto',
    };

    // Événement de debug pour la requête
    onDebugEvent({
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'request',
      source: 'frontend',
      data: requestPayload,
      description: `Envoi de la requête à OpenRouter (${requestPayload.model})`,
    });

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': this.config.siteUrl || window.location.origin,
          'X-Title': this.config.siteName || 'Autobot Demo',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Erreur API OpenRouter');
      }

      const completion = await response.json();
      const choice = completion.choices[0];
      const uiComponents: any[] = [];

      // Gestion des Tool Calls (A2UI)
      if (choice.message.tool_calls) {
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

              onDebugEvent({
                id: uuidv4(),
                timestamp: Date.now(),
                type: 'tool_call',
                source: 'llm',
                data: { 
                  function: toolCall.function.name, 
                  arguments: toolCall.function.arguments, // JSON brut envoyé par le modèle
                  parsedArguments: args,
                  component 
                },
                description: `Appel d'outil détecté : ${toolCall.function.name} (${args.type})`,
              });
            } catch (e) {
              console.error('Erreur parsing tool call', e);
            }
          }
        }
      }

      // Extraction du raisonnement (OpenRouter specific)
      const reasoning = choice.message.reasoning || null;
      if (reasoning) {
        onDebugEvent({
          id: uuidv4(),
          timestamp: Date.now(),
          type: 'thought',
          source: 'llm',
          data: { reasoning },
          description: 'Raisonnement généré par le modèle',
        });
      }

      // Événement de debug pour la réponse
      onDebugEvent({
        id: uuidv4(),
        timestamp: Date.now(),
        type: 'response',
        source: 'llm',
        data: {
          usage: completion.usage,
          model: completion.model,
          id: completion.id,
          message: choice.message, // Inclure le message pour reconstruction
        },
        description: `Réponse reçue (${completion.usage?.total_tokens || 0} tokens)`,
      });

      const responseMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: choice.message.content || '',
        timestamp: Date.now(),
        uiComponents: uiComponents.length > 0 ? uiComponents : undefined,
        reasoning: reasoning,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        } : undefined,
      };

      return { message: responseMessage };
    } catch (error: any) {
      onDebugEvent({
        id: uuidv4(),
        timestamp: Date.now(),
        type: 'error',
        source: 'llm',
        data: { error: error.message },
        description: `Erreur OpenRouter : ${error.message}`,
      });
      throw error;
    }
  }
}

export const openRouterService = new OpenRouterService();
