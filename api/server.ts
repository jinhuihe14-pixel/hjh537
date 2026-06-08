
import { createServer } from 'http';
import app from './app.js';
import { GameServer } from './game/GameServer.js';

const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);

const gameServer = new GameServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
  console.log(`Game WebSocket server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  gameServer.stop();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  gameServer.stop();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
