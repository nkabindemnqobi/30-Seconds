const homeRouter = require('../../routes/home');
const { fetchLobbiesQuery } = require('../../queries/home');
jest.mock('../../queries/home', () => ({
  fetchLobbiesQuery: jest.fn(),
}));

describe('GET /lobbies handler', () => {
  let req, res;

  const getHandler = () => {
    const route = homeRouter.stack.find(r => r.route?.path === '/lobbies');
    return route.route.stack[0].handle;
  };

  beforeEach(() => {
    req = { query: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return 200 and format lobby data correctly', async () => {
    fetchLobbiesQuery.mockResolvedValue([
      {
        matchId: 1,
        joinCode: 'JOIN123',
        lobbyName: 'Fun Lobby',
        startedDatetime: '2024-05-01T10:00:00Z',
        categoryId: 1,
        categoryName: 'General Knowledge',
        creatorAlias: 'User1',
        maxParticipants: 10,
        participantCount: 6,
        bannedUserId: 6,
        bannedUserAlias: 'User6',
      },
      {
        matchId: 1,
        joinCode: 'JOIN123',
        lobbyName: 'Fun Lobby',
        startedDatetime: '2024-05-01T10:00:00Z',
        categoryId: 2,
        categoryName: 'Celebrities',
        creatorAlias: 'User1',
        maxParticipants: 10,
        participantCount: 6,
        bannedUserId: 6,
        bannedUserAlias: 'User6',
      }
    ]);

    const handler = getHandler();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      {
        matchId: 1,
        joinCode: 'JOIN123',
        lobbyName: 'Fun Lobby',
        startedDatetime: '2024-05-01T10:00:00Z',
        creatorAlias: 'User1',
        maxParticipants: 10,
        participantCount: 6,
        categories: [
          { id: 1, name: 'General Knowledge' },
          { id: 2, name: 'Celebrities' }
        ],
        bannedUsers: [
          { id: 6, alias: 'User6' }
        ]
      }
    ]);
  });

  it('should return 404 if no lobbies found', async () => {
    fetchLobbiesQuery.mockResolvedValue([]);

    const handler = getHandler();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'No lobbies found' });
  });

  it('should return 503 for connection error', async () => {
    const error = new Error('Connection refused');
    error.code = 'ECONNREFUSED';
    error.isConnectionError = true;

    fetchLobbiesQuery.mockRejectedValue(error);

    const handler = getHandler();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      reason: 'Connection refused',
    });
  });

  it('should return 500 for unknown errors', async () => {
    const error = new Error('Something bad');
    fetchLobbiesQuery.mockRejectedValue(error);

    const handler = getHandler();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      reason: 'Something bad',
    });
  });

  it('should return masked error in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Sensitive info');
    fetchLobbiesQuery.mockRejectedValue(error);

    const handler = getHandler();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      reason: 'An unexpected error occurred. Please try again later.',
    });

    process.env.NODE_ENV = originalEnv;
  });
});
