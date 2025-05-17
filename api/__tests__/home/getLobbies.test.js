const { fetchLobbiesQuery } = require('../../queries/home');
const { fetchLobbies } = require('../../handlers/Home');
const { formatErrorResponse, getUnexpectedErrorStatus } = require('../../utils/formatErrorResponse');

jest.mock('../../queries/home', () => ({
  fetchLobbiesQuery: jest.fn(),
}));

describe('GET /lobbies handler', () => {
  let req, res, next;

  const handler = async (req, res, next) => {
    try {
      const { status, isPublic, creatorAlias } = req.query;
      const lobbies = await fetchLobbies({ status, isPublic, creatorAlias });

      if (!lobbies || lobbies.length === 0) {
        return next(formatErrorResponse(404, 'No lobbies found'));
      }

      res.status(200).json(lobbies);
    } catch (error) {
      return next(formatErrorResponse(getUnexpectedErrorStatus(error)));
    }
  };

  beforeEach(() => {
    req = { query: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    jest.spyOn(console, 'error').mockImplementation(() => { });
    next = jest.fn();
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

    await handler(req, res, next);

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
    await handler(req, res, next);
    const thrownError = next.mock.calls[0][0];
    expect(thrownError.message).toBe('No lobbies found');
    expect(thrownError.status).toBe(404);
  });

  it('should return 503 for connection error', async () => {
    const error = new Error('Connection refused');
    error.code = 'ECONNREFUSED';
    error.isConnectionError = true;

    fetchLobbiesQuery.mockRejectedValue(error);

    await handler(req, res, next);
    const thrownError = next.mock.calls[0][0];
    expect(thrownError.message).toBe('An unexpected error occurred');
    expect(thrownError.status).toBe(503);
  });

  it('should return 500 for unknown errors', async () => {
    const error = new Error('Something bad');
    fetchLobbiesQuery.mockRejectedValue(error);

    await handler(req, res, next);

    const thrownError = next.mock.calls[0][0];
    expect(thrownError.message).toBe('An unexpected error occurred');
    expect(thrownError.status).toBe(500);
  });

});
