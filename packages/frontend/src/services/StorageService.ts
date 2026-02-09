import { openDB, IDBPDatabase } from 'idb';
import { Config } from '../types';

const DB_NAME = 'autobot_db';
const DB_VERSION = 1;

export class StorageService {
  private db: Promise<IDBPDatabase>;

  constructor() {
    this.db = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config');
        }
        if (!db.objectStoreNames.contains('conversations')) {
          db.createObjectStore('conversations', { keyPath: 'id' });
        }
      },
    });
  }

  async saveConfig(config: Config): Promise<void> {
    const db = await this.db;
    await db.put('config', config, 'current');
  }

  async getConfig(): Promise<Config | null> {
    const db = await this.db;
    return db.get('config', 'current');
  }

  async saveConversation(id: string, events: any[]): Promise<void> {
    const db = await this.db;
    await db.put('conversations', { id, events, updatedAt: Date.now() });
  }

  async getConversation(id: string): Promise<any[]> {
    const db = await this.db;
    const conv = await db.get('conversations', id);
    return conv ? conv.events : [];
  }

  async listConversations(): Promise<any[]> {
    const db = await this.db;
    return db.getAll('conversations');
  }

  async deleteConversation(id: string): Promise<void> {
    const db = await this.db;
    await db.delete('conversations', id);
  }

  async clearAll(): Promise<void> {
    const db = await this.db;
    await db.clear('config');
    await db.clear('conversations');
  }
  
  // Pour l'explorateur de DB
  async getRawData(storeName: string): Promise<any[]> {
    const db = await this.db;
    if (storeName === 'config') {
       const config = await db.get('config', 'current');
       return config ? [{ id: 'current', ...config }] : [];
    }
    return db.getAll(storeName as any);
  }
}

export const storageService = new StorageService();
