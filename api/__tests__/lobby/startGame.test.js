const { handleStartGame } = require('../../handlers/Lobby');
const { startGame } = require('../../queries/lobby');
const { broadcastToMatch } = require('../../utils/SSEManager');

jest.mock('../../queries/lobby', () => ({
  startGame: jest.fn(),
}));

jest.mock('../../utils/SSEManager', () => ({
  broadcastToMatch: jest.fn(),
}));

describe('handleStartGame', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { joinCode: 'C6F6C631' },
      body: { userId: 1 }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  it('should start the game and broadcast', async () => {
    startGame.mockResolvedValue({ matchId: 5 });

    await handleStartGame(req, res, next);

    expect(startGame).toHaveBeenCalledWith({ joinCode: 'C6F6C631', userId: 1 });
    expect(broadcastToMatch).toHaveBeenCalledWith('C6F6C631', {
      data: { message: 'Game started!', matchId: 5 }
    }, 'game_started');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Game started successfully.' });
  });

  it('should return 400 for missing userId or joinCode', async () => {
    req.body = {};
    req.params = {};

    await handleStartGame(req, res, next);

    const thrownError = next.mock.calls[0][0];
    expect(thrownError.message).toBe("Missing joinCode or userId");
    expect(thrownError.status).toBe(400);
  });

  it('should return 500 if startGame fails', async () => {
    const error = new Error('Start failed');
    startGame.mockRejectedValue(error);

    await handleStartGame(req, res, next);

    const thrownError = next.mock.calls[0][0];
    expect(thrownError.message).toBe('An unexpected error occurred');
  });
});
