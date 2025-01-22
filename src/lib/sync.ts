import Peer from 'peerjs';
import { openDB } from 'idb';

// Types
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string; // ISO string format
  createdAt: number;
  updatedAt: number;
}

interface SyncData {
  todos: Todo[];
  lastSync: number;
}

// Generate ICS file content
export const generateICS = (todos: Todo[]): string => {
  const events = todos
    .filter(todo => todo.dueDate)
    .map(todo => {
      const dueDate = new Date(todo.dueDate!);
      const uid = `${todo.id}@todos-app`;
      return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${new Date(todo.createdAt).toISOString().replace(/[-:.]/g, '').slice(0, -4)}Z
DTSTART;VALUE=DATE:${dueDate.toISOString().slice(0, 10).replace(/-/g, '')}
SUMMARY:${todo.text}${todo.completed ? ' (Completed)' : ''}
STATUS:${todo.completed ? 'COMPLETED' : 'NEEDS-ACTION'}
END:VEVENT`;
    })
    .join('\n');

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Todos App//EN
CALSCALE:GREGORIAN
${events}
END:VCALENDAR`;
};

// Generate a random sync code
export const generateSyncCode = (): string => {
  const array = new Uint8Array(15);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Initialize IndexedDB
export const initDB = async () => {
  return openDB('todos-db', 1, {
    upgrade(db) {
      db.createObjectStore('todos', { keyPath: 'id' });
      db.createObjectStore('sync', { keyPath: 'id' });
    },
  });
};

// Encrypt data using the sync code as key
const encryptData = async (data: any, syncCode: string): Promise<string> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(syncCode),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('todo-sync-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoder.encode(JSON.stringify(data))
  );

  return JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
  });
};

// Decrypt data using the sync code
const decryptData = async (encryptedData: string, syncCode: string): Promise<any> => {
  const { iv, data } = JSON.parse(encryptedData);
  const encoder = new TextEncoder();
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(syncCode),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('todo-sync-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv),
    },
    key,
    new Uint8Array(data)
  );

  return JSON.parse(new TextDecoder().decode(decrypted));
};

// Initialize P2P connection
export const initSync = (syncCode: string, onSync: (data: SyncData) => void) => {
  const peer = new Peer(syncCode);
  
  peer.on('connection', (conn) => {
    conn.on('data', async (encryptedData: string) => {
      try {
        const data = await decryptData(encryptedData, syncCode);
        onSync(data);
      } catch (error) {
        console.error('Failed to decrypt sync data:', error);
      }
    });
  });

  return peer;
};

// Connect to another device
export const connectToDevice = async (
  peer: Peer,
  targetId: string,
  syncCode: string,
  data: SyncData
) => {
  const conn = peer.connect(targetId);
  
  conn.on('open', async () => {
    const encryptedData = await encryptData(data, syncCode);
    conn.send(encryptedData);
  });

  return conn;
};