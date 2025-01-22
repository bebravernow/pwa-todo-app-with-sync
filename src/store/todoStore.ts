import { create } from 'zustand';
import { openDB } from 'idb';
import { Todo, initDB } from '../lib/sync';

interface TodoStore {
  todos: Todo[];
  syncCode: string | null;
  darkMode: boolean;
  addTodo: (text: string, dueDate?: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  updateTodoDueDate: (id: string, dueDate: string) => Promise<void>;
  setSyncCode: (code: string) => void;
  setDarkMode: (enabled: boolean) => void;
  loadTodos: () => Promise<void>;
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  syncCode: null,
  darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,

  addTodo: async (text: string, dueDate?: string) => {
    const todo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const db = await initDB();
    await db.put('todos', todo);

    set(state => ({
      todos: [...state.todos, todo],
    }));
  },

  toggleTodo: async (id: string) => {
    const db = await initDB();
    const todo = await db.get('todos', id);
    
    if (todo) {
      const updatedTodo = {
        ...todo,
        completed: !todo.completed,
        updatedAt: Date.now(),
      };
      
      await db.put('todos', updatedTodo);
      
      set(state => ({
        todos: state.todos.map(t => 
          t.id === id ? updatedTodo : t
        ),
      }));
    }
  },

  deleteTodo: async (id: string) => {
    const db = await initDB();
    await db.delete('todos', id);
    
    set(state => ({
      todos: state.todos.filter(todo => todo.id !== id),
    }));
  },

  updateTodoDueDate: async (id: string, dueDate: string) => {
    const db = await initDB();
    const todo = await db.get('todos', id);
    
    if (todo) {
      const updatedTodo = {
        ...todo,
        dueDate,
        updatedAt: Date.now(),
      };
      
      await db.put('todos', updatedTodo);
      
      set(state => ({
        todos: state.todos.map(t => 
          t.id === id ? updatedTodo : t
        ),
      }));
    }
  },

  setSyncCode: (code: string) => {
    set({ syncCode: code });
    localStorage.setItem('syncCode', code);
  },

  setDarkMode: (enabled: boolean) => {
    set({ darkMode: enabled });
    localStorage.setItem('darkMode', enabled.toString());
    if (enabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  loadTodos: async () => {
    const db = await initDB();
    const todos = await db.getAll('todos');
    set({ todos });
    
    // Load dark mode preference
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode !== null) {
      const enabled = darkMode === 'true';
      set({ darkMode: enabled });
      if (enabled) {
        document.documentElement.classList.add('dark');
      }
    }
  },
}));