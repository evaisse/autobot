import fs from 'fs';
import path from 'path';

/**
 * Simple file-based storage system
 * 
 * This is an ultra-simple embedded storage solution that uses JSON files
 * to persist data. Perfect for demonstration and pedagogical purposes.
 */

const DATA_DIR = path.join(process.cwd(), 'data');

export class Storage {
  constructor() {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  /**
   * Save configuration to storage
   */
  saveConfig(config: any): void {
    const configPath = path.join(DATA_DIR, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Load configuration from storage
   */
  loadConfig(): any {
    const configPath = path.join(DATA_DIR, 'config.json');
    if (!fs.existsSync(configPath)) {
      return null;
    }
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  }

  /**
   * Save conversation messages
   */
  saveConversation(conversationId: string, messages: any[]): void {
    const convPath = path.join(DATA_DIR, `conversation_${conversationId}.json`);
    fs.writeFileSync(convPath, JSON.stringify(messages, null, 2));
  }

  /**
   * Load conversation messages
   */
  loadConversation(conversationId: string): any[] {
    const convPath = path.join(DATA_DIR, `conversation_${conversationId}.json`);
    if (!fs.existsSync(convPath)) {
      return [];
    }
    const data = fs.readFileSync(convPath, 'utf-8');
    return JSON.parse(data);
  }

  /**
   * List all conversations
   */
  listConversations(): string[] {
    const files = fs.readdirSync(DATA_DIR);
    return files
      .filter(f => f.startsWith('conversation_') && f.endsWith('.json'))
      .map(f => f.replace('conversation_', '').replace('.json', ''));
  }
}

export const storage = new Storage();
