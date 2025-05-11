const { handleCreateLobby } = require('../../handlers/CreateLobby');
const { createLobby } = require('../../queries/createLobby');
const { addUserToMatch, sendToUser } = require('../../utils/SSEManager');

jest.mock('../../queries/createLobby');
jest.mock('../../utils/SSEManager');

describe('handleCreateLobby', () => {
  let req, res;
  let originalConsoleError;

  beforeEach(() => {
    req = {
      body: {
        userId: 1,
        categoryIds: [1, 2],
        isPublic: true,
        maxParticipants: 4,
        lobbyName: 'Test Lobby'
      }
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    originalConsoleError = console.error;
    console.error = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should create a lobby and return joinCode', async () => {
    createLobby.mockResolvedValue('ABC123');

    await handleCreateLobby(req, res);

    expect(createLobby).toHaveBeenCalledWith({
      userId: 1,
      categoryIds: [1, 2],
      isPublic: true,
      maxParticipants: 4,
      lobbyName: 'Test Lobby'
    });
    expect(addUserToMatch).toHaveBeenCalledWith('ABC123', 1);
    expect(sendToUser).toHaveBeenCalledWith(1, {
      data: {
        message: 'Match created successfully.',
        joinCode: 'ABC123',
        lobbyName: 'Test Lobby'
      }
    }, 'match_created');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ data: { joinCode: 'ABC123' } });
  });

  it('should return 400 for invalid input', async () => {
    req.body.userId = null;
    await handleCreateLobby(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid input' });
  });

  it('should return 500 on DB failure', async () => {
    const error = new Error('DB fail');
    createLobby.mockRejectedValue(error);

    await handleCreateLobby(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      reason: 'DB fail'
    });
  });

  it('should handle SSE failure gracefully', async () => {
    createLobby.mockResolvedValue('SSEFAIL');
    sendToUser.mockImplementation(() => { throw new Error('SSE error'); });

    await expect(handleCreateLobby(req, res)).resolves.not.toThrow();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should confirm creator is inserted with Creator status via query mock', async () => {
    createLobby.mockImplementation(async () => {
      return 'CONFIRM01';
    });

    await handleCreateLobby(req, res);

    expect(addUserToMatch).toHaveBeenCalledWith('CONFIRM01', 1);
    expect(sendToUser).toHaveBeenCalledWith(1, expect.objectContaining({
      data: expect.objectContaining({ joinCode: 'CONFIRM01' })
    }), 'match_created');
  });
});
