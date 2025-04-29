import Fastify from 'fastify';
import Redis from 'ioredis';
import cors from '@fastify/cors';
import { promptController } from './controllers/promptController.js';
import { ollamaService } from './services/ollamaService.js';

// Initialize Redis with error handling
let redis;
try {
  redis = new Redis(process.env.REDIS_URL);
  console.log("Redis connection established");

  redis.on('error', (err) => {
    console.error('Redis error:', err);
  });
} catch (err) {
  console.error('Failed to connect to Redis:', err);
  process.exit(1);
}

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      }
    }
  }
});

// Register CORS for localhost
await fastify.register(cors, {
  origin: [
    'http://localhost',
    'http://localhost:3000',
    'http://127.0.0.1',
    'http://127.0.0.1:3000'
  ]
});

const TEAMS_KEY = 'teams';
const INITIAL_TEAMS = [
  { id: 'team-1', name: 'EcoCoders', color: '#22c55e', score: 1250, memberCount: 12, logo: 'leaf' },
  { id: 'team-2', name: 'SustainTech', color: '#0ea5e9', score: 980, memberCount: 10, logo: 'droplets' },
  { id: 'team-3', name: 'GreenBytes', color: '#a855f7', score: 1420, memberCount: 14, logo: 'cpu' },
  { id: 'team-4', name: 'EarthPrompt', color: '#f97316', score: 890, memberCount: 8, logo: 'globe' },
  { id: 'team-5', name: 'DataSavers', color: '#ec4899', score: 1050, memberCount: 11, logo: 'save' }
];

async function initTeams() {
  try {
    const exists = await redis.exists(TEAMS_KEY);
    if (!exists) {
      console.log("Initializing teams data in Redis");
      await redis.set(TEAMS_KEY, JSON.stringify(INITIAL_TEAMS));
      console.log("Teams initialized successfully");
    } else {
      console.log("Teams data already exists in Redis");
    }
  } catch (err) {
    console.error("Error initializing teams:", err);
    throw err;
  }
}

// Decorator for updating team scores
fastify.decorate('updateTeamScore', async function(teamId, scoreChange) {
  console.log(`Updating team ${teamId} score by ${scoreChange} points`);

  try {
    const teamsRaw = await redis.get(TEAMS_KEY);
    if (!teamsRaw) {
      throw new Error('Teams not initialized');
    }

    const teams = JSON.parse(teamsRaw);
    const teamIndex = teams.findIndex(t => t.id === teamId);

    if (teamIndex === -1) {
      throw new Error(`Team not found with id: ${teamId}`);
    }

    // Create a copy of the team to update
    const team = { ...teams[teamIndex] };
    team.score += scoreChange;

    // Ensure score doesn't go below zero
    if (team.score < 0) team.score = 0;

    // Update the team in the array
    teams[teamIndex] = team;

    // Save updated teams back to Redis
    await redis.set(TEAMS_KEY, JSON.stringify(teams));
    console.log(`Team ${teamId} score updated to ${team.score}`);

    return team;
  } catch (error) {
    console.error(`Error updating team score:`, error);
    throw error;
  }
});

// Add Ollama service
fastify.decorate('ollamaService', ollamaService);

// Basic health check
fastify.get('/', async (request, reply) => {
  return {
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  };
});

// Get all teams
fastify.get('/teams', async (request, reply) => {
  try {
    const teamsRaw = await redis.get(TEAMS_KEY);
    if (!teamsRaw) {
      return reply.code(500).send({ error: 'Teams not initialized' });
    }

    const teams = JSON.parse(teamsRaw);
    // Sort teams by score (highest first)
    teams.sort((a, b) => b.score - a.score);

    return teams;
  } catch (error) {
    request.log.error(`Error getting teams: ${error.message}`);
    return reply.code(500).send({ error: 'Failed to get teams' });
  }
});

// Add a member to a team
fastify.post('/member/join', async (request, reply) => {
  const { id } = request.body;

  if (!id) {
    return reply.code(400).send({ error: 'Missing team id' });
  }

  try {
    const teamsRaw = await redis.get(TEAMS_KEY);
    if (!teamsRaw) {
      return reply.code(500).send({ error: 'Teams not initialized' });
    }

    const teams = JSON.parse(teamsRaw);
    const teamIndex = teams.findIndex(t => t.id === id);

    if (teamIndex === -1) {
      return reply.code(404).send({ error: 'Team not found' });
    }

    const team = { ...teams[teamIndex] };
    team.memberCount += 1;
    teams[teamIndex] = team;

    await redis.set(TEAMS_KEY, JSON.stringify(teams));
    console.log(`Added member to team ${id}, new count: ${team.memberCount}`);

    return { success: true, team };
  } catch (error) {
    request.log.error(`Error adding member to team: ${error.message}`);
    return reply.code(500).send({ error: 'Failed to add member to team' });
  }
});

// Update team score
fastify.post('/team/score', async (request, reply) => {
  const { id, score } = request.body;

  if (!id || typeof score !== 'number') {
    return reply.code(400).send({ error: 'Missing id or score' });
  }

  try {
    const team = await fastify.updateTeamScore(id, score);
    return { success: true, team };
  } catch (error) {
    request.log.error(`Error updating team score: ${error.message}`);
    return reply.code(400).send({ error: error.message });
  }
});

// New endpoint for prompt evaluation with Ollama
fastify.post('/prompt/evaluate', promptController.evaluatePrompt);

// Check Ollama connection
fastify.get('/ollama/status', async (request, reply) => {
  try {
    // Simple test prompt to check if Ollama is responding
    const result = await ollamaService.evaluatePrompt("This is a test prompt");
    return {
      status: 'ok',
      message: 'Ollama service is responding'
    };
  } catch (error) {
    request.log.error(`Ollama connection error: ${error.message}`);
    return reply.code(500).send({
      status: 'error',
      message: 'Could not connect to Ollama service',
      error: error.message
    });
  }
});

const start = async () => {
  try {
    await initTeams();

    // Test Ollama connection before starting
    try {
      await ollamaService.evaluatePrompt("Test connection");
      console.log("Ollama service connection successful");
    } catch (error) {
      console.warn("WARNING: Could not connect to Ollama service:", error.message);
      console.warn("The server will start, but prompt evaluation may not work.");
      console.warn("Make sure Ollama is running and the deepseek-r1 model is available.");
    }

    const port = process.env.PORT || 4000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server is running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();