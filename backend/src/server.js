const app = require('./app');
const prisma = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify DB connection
    await prisma.$connect();
    console.log('Connected to SQLite Database via Prisma');

    app.listen(PORT, () => {
      console.log(`NeuroEarly Backend Service listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start backend server:', error);
    process.exit(1);
  }
}

startServer();
