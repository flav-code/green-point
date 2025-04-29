import Fastify from 'fastify';
import Redis from 'ioredis';
import cors from '@fastify/cors';

const redis = new Redis(process.env.REDIS_URL);

const fastify = Fastify({ logger: true });

// Register CORS for localhost
await fastify.register(cors, {
  origin: [
    'http://localhost',
    'http://localhost:4173',
    'http://127.0.0.1',
    'http://127.0.0.1:4173'
  ]
});

const TEAMS_KEY = 'teams';
const INITIAL_TEAMS = [
  { id: 'team-1', name: 'EcoCoders', color: '#22c55e', score: 0, memberCount: 0, logo: 'leaf' },
  { id: 'team-2', name: 'SustainTech', color: '#0ea5e9', score: 0, memberCount: 0, logo: 'droplets' },
  { id: 'team-3', name: 'GreenBytes', color: '#a855f7', score: 0, memberCount: 0, logo: 'cpu' },
  { id: 'team-4', name: 'EarthPrompt', color: '#f97316', score: 0, memberCount: 0, logo: 'globe' },
  { id: 'team-5', name: 'DataSavers', color: '#ec4899', score: 0, memberCount: 0, logo: 'save' }
];

async function initTeams() {
  const exists = await redis.exists(TEAMS_KEY);
  if (!exists) {
    await redis.set(TEAMS_KEY, JSON.stringify(INITIAL_TEAMS));
  }
}

fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

fastify.get('/teams', async (request, reply) => {
  const teamsRaw = await redis.get(TEAMS_KEY);
  if (!teamsRaw) return reply.code(500).send({ error: 'Teams not initialized' });
  return JSON.parse(teamsRaw);
});

fastify.post('/member/join', async (request, reply) => {
  const { id } = request.body;
  if (!id) return reply.code(400).send({ error: 'Missing team id' });
  const teamsRaw = await redis.get(TEAMS_KEY);
  if (!teamsRaw) return reply.code(500).send({ error: 'Teams not initialized' });
  const teams = JSON.parse(teamsRaw);
  const team = teams.find(t => t.id === id);
  if (!team) return reply.code(404).send({ error: 'Team not found' });
  team.memberCount += 1;
  await redis.set(TEAMS_KEY, JSON.stringify(teams));
  return { success: true, team };
});

fastify.post('/team/score', async (request, reply) => {
  const { id, score } = request.body;
  if (!id || typeof score !== 'number') return reply.code(400).send({ error: 'Missing id or score' });
  const teamsRaw = await redis.get(TEAMS_KEY);
  if (!teamsRaw) return reply.code(500).send({ error: 'Teams not initialized' });
  const teams = JSON.parse(teamsRaw);
  const team = teams.find(t => t.id === id);
  if (!team) return reply.code(404).send({ error: 'Team not found' });
  team.score += score;
  await redis.set(TEAMS_KEY, JSON.stringify(teams));
  return { success: true, team };
});

const start = async () => {
  try {
    await initTeams();
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
