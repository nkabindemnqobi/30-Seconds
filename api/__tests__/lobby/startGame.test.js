const { handleStartGame } = require('../../handlers/Lobby');
const { startGame } = require('../../queries/lobby');
const { broadcastToMatch } = require('../../utils/SSEManager');

jest.mock('../../queries/Lobby');
jest.mock('../../utils/SSEManager');

describe('handleStartGame', () => {
  let req, res;
  let originalConsoleError;

  beforeEach(() => {
    req = {
      params: { joinCode: 'C6F6C631' },
      body: { userId: 1 }
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

  it('should start the game and broadcast', async () => {
    startGame.mockResolvedValue({ matchId: 5 });

    await handleStartGame(req, res);

    expect(startGame).toHaveBeenCalledWith({ joinCode: 'C6F6C631', userId: 1 });
    expect(broadcastToMatch).toHaveBeenCalledWith('C6F6C631', {
      data: { message: 'Game started!', matchId: 5 }
    }, 'game_started');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Game started successfully.' });
  });

  it('should return 400 for missing userId or joinCode', async () => {
    req.body.userId = null;

    await handleStartGame(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Missing joinCode or userId' });
  });

  it('should return 500 if startGame fails', async () => {
    const error = new Error('Start failed');
    startGame.mockRejectedValue(error);

    await handleStartGame(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      reason: 'Start failed'
    });
  });
});
