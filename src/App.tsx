import React, { useEffect, useState } from 'react';
import { Plus, Check, Trash2, Share2, Link, Calendar, Moon, Sun, Download, ExternalLink } from 'lucide-react';
import { useTodoStore } from './store/todoStore';
import { generateSyncCode, initSync, connectToDevice, generateICS } from './lib/sync';

function App() {
  const { 
    todos, 
    addTodo, 
    toggleTodo, 
    deleteTodo, 
    updateTodoDueDate,
    syncCode, 
    setSyncCode, 
    darkMode,
    setDarkMode,
    loadTodos 
  } = useTodoStore();
  const [newTodo, setNewTodo] = useState('');
  const [newTodoDueDate, setNewTodoDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDevice, setTargetDevice] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [icsUrl, setIcsUrl] = useState('');

  useEffect(() => {
    loadTodos();
    const savedSyncCode = localStorage.getItem('syncCode');
    if (savedSyncCode) {
      setSyncCode(savedSyncCode);
      initSync(savedSyncCode, ({ todos }) => {
        todos.forEach(todo => {
          addTodo(todo.text, todo.dueDate);
        });
      });
    }

    // Generate ICS feed URL
    const baseUrl = window.location.origin;
    const feedUrl = `${baseUrl}/api/calendar.ics?code=${encodeURIComponent(savedSyncCode || '')}`;
    setIcsUrl(feedUrl);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      addTodo(newTodo.trim(), newTodoDueDate);
      setNewTodo('');
      setNewTodoDueDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleGenerateCode = () => {
    const code = generateSyncCode();
    setSyncCode(code);
    initSync(code, ({ todos }) => {
      todos.forEach(todo => {
        addTodo(todo.text, todo.dueDate);
      });
    });
    
    // Update ICS feed URL with new sync code
    const baseUrl = window.location.origin;
    const feedUrl = `${baseUrl}/api/calendar.ics?code=${encodeURIComponent(code)}`;
    setIcsUrl(feedUrl);
  };

  const handleConnect = () => {
    if (syncCode && targetDevice) {
      connectToDevice(initSync(syncCode, () => {}), targetDevice, syncCode, {
        todos,
        lastSync: Date.now(),
      });
    }
  };

  const handleExportICS = () => {
    const icsContent = generateICS(todos);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'todos.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen transition-colors ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' 
        : 'bg-gradient-to-br from-indigo-100 to-purple-100 text-gray-900'
    } p-4`}>
      <div className={`max-w-md mx-auto ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-xl shadow-lg overflow-hidden`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-2xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>Tasks</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 ${
                  darkMode 
                    ? 'text-yellow-400 hover:text-yellow-300' 
                    : 'text-gray-600 hover:text-gray-800'
                } transition-colors`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleExportICS}
                className={`p-2 ${
                  darkMode 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-800'
                } transition-colors`}
                aria-label="Export as ICS"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowSyncModal(true)}
                className={`p-2 ${
                  darkMode 
                    ? 'text-indigo-400 hover:text-indigo-300' 
                    : 'text-indigo-600 hover:text-indigo-800'
                } transition-colors`}
                aria-label="Sync settings"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="Add a new task..."
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <input
                  type="date"
                  value={newTodoDueDate}
                  onChange={(e) => setNewTodoDueDate(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <button
                type="submit"
                className={`p-2 text-white rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-indigo-600 hover:bg-indigo-700' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
                aria-label="Add task"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </form>

          <ul className="space-y-3">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className={`flex items-center gap-3 p-3 rounded-lg group ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`p-2 rounded-full transition-colors ${
                    todo.completed
                      ? 'bg-green-100 text-green-600'
                      : darkMode 
                        ? 'bg-gray-600 text-gray-400' 
                        : 'bg-gray-200 text-gray-400'
                  }`}
                  aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  <Check className="w-4 h-4" />
                </button>
                <div className="flex-1">
                  <span
                    className={`block ${
                      todo.completed 
                        ? 'text-gray-400 line-through' 
                        : darkMode ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {todo.text}
                  </span>
                  {todo.dueDate && (
                    <span className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Due: {new Date(todo.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {editingTodoId === todo.id ? (
                    <input
                      type="date"
                      value={todo.dueDate || ''}
                      onChange={(e) => {
                        updateTodoDueDate(todo.id, e.target.value);
                        setEditingTodoId(null);
                      }}
                      className={`px-2 py-1 border rounded ${
                        darkMode 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  ) : (
                    <button
                      onClick={() => setEditingTodoId(todo.id)}
                      className={`p-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                        darkMode 
                          ? 'text-blue-400 hover:text-blue-300' 
                          : 'text-blue-600 hover:text-blue-800'
                      }`}
                      aria-label="Edit due date"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className={`p-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                      darkMode 
                        ? 'text-red-400 hover:text-red-300' 
                        : 'text-red-600 hover:text-red-800'
                    }`}
                    aria-label="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {showSyncModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className={`${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } rounded-xl p-6 max-w-md w-full`}>
            <h2 className={`text-xl font-bold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>Sync Settings</h2>
            
            {!syncCode ? (
              <div className="space-y-4">
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  Generate a sync code to enable synchronization between devices.
                </p>
                <button
                  onClick={handleGenerateCode}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Generate Sync Code
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-3 rounded-lg flex items-center justify-between ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <code className={`text-sm ${
                    darkMode ? 'text-gray-300' : 'text-gray-800'
                  }`}>{syncCode}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(syncCode)}
                    className={`p-2 ${
                      darkMode 
                        ? 'text-gray-400 hover:text-gray-300' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    aria-label="Copy sync code"
                  >
                    <Link className="w-4 h-4" />
                  </button>
                </div>

                <div className={`p-3 rounded-lg space-y-2 ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <p className={`text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Calendar Subscription URL:</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className={`text-xs break-all ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>{icsUrl}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(icsUrl)}
                      className={`p-2 flex-shrink-0 ${
                        darkMode 
                          ? 'text-gray-400 hover:text-gray-300' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                      aria-label="Copy calendar URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <input
                    type="text"
                    value={targetDevice}
                    onChange={(e) => setTargetDevice(e.target.value)}
                    placeholder="Enter device sync code..."
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <button
                    onClick={handleConnect}
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Connect to Device
                  </button>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setShowSyncModal(false)}
              className={`mt-4 w-full py-2 border rounded-lg transition-colors ${
                darkMode 
                  ? 'border-gray-600 hover:bg-gray-700 text-white' 
                  : 'border-gray-300 hover:bg-gray-50 text-gray-800'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;