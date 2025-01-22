# Minimalist Todo App

A modern, minimalist todo application with device synchronization and calendar integration capabilities.

## Features

- ✨ Clean, minimalist interface
- 🌓 Dark/Light mode with system preference detection
- 📱 Device synchronization using secure P2P connections
- 📅 Calendar integration with subscribable ICS feed
- 🔄 Offline support with IndexedDB
- 📲 Progressive Web App (PWA) ready
- 🐳 Docker support for easy self-hosting

## Self-Hosting

### Prerequisites

- Docker
- Docker Compose

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/todo-app.git
cd todo-app
```

2. Build and start the containers:
```bash
docker-compose up -d
```

The application will be available at `http://localhost:3000`.

### Configuration

Environment variables (in docker-compose.yml):
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (default: production)

### Data Persistence

Todo data is stored in a Docker volume named `todo-data`. This ensures your data persists across container restarts.

To backup your data:
```bash
docker run --rm -v todo-app_todo-data:/data -v $(pwd):/backup alpine tar czf /backup/todos-backup.tar.gz /data
```

To restore from backup:
```bash
docker run --rm -v todo-app_todo-data:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/todos-backup.tar.gz --strip 1"
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Security

- All sync data is end-to-end encrypted
- Sync codes are never stored on servers
- P2P connections are encrypted
- Calendar feed requires valid sync code
- Data is stored locally in LevelDB

## License

MIT