const { getAllPublicLobbies } = require('../../handlers/Home');
const db = require('../../db/query');
jest.mock('../../db/query');

describe('getAllPublicLobbies', () => {
    let req, res;

    beforeEach(() => {
        req = {};
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return grouped public lobbies with categories and banned users formatted', async () => {
        db.executeQuery.mockResolvedValue([
            {
                matchId: 1,
                joinCode: 'JOIN123',
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

        await getAllPublicLobbies(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([
            {
                matchId: 1,
                joinCode: 'JOIN123',
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

    it('should not return public matches that are not in Lobby status', async () => {
        const json = jest.fn();
        const status = jest.fn().mockReturnThis();
        const send = jest.fn();

        res = { json, status, send };
        db.executeQuery.mockResolvedValue([]);

        await getAllPublicLobbies(req, res);

        expect(db.executeQuery).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'No public lobbies found' });
    });
    

    it('should deduplicate categories for the same match', async () => {
        db.executeQuery.mockResolvedValue([
            {
                matchId: 2,
                joinCode: 'JOIN456',
                startedDatetime: '2024-05-01T12:00:00Z',
                categoryId: 3,
                categoryName: 'Geography',
                creatorAlias: 'User3',
                maxParticipants: 8,
                participantCount: 3,
                bannedUserId: null,
                bannedUserAlias: null,
            },
            {
                matchId: 2,
                joinCode: 'JOIN456',
                startedDatetime: '2024-05-01T12:00:00Z',
                categoryId: 3,
                categoryName: 'Geography',
                creatorAlias: 'User3',
                maxParticipants: 8,
                participantCount: 3,
                bannedUserId: null,
                bannedUserAlias: null,
            }
        ]);
    
        await getAllPublicLobbies(req, res);
    
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([
            {
                matchId: 2,
                joinCode: 'JOIN456',
                startedDatetime: '2024-05-01T12:00:00Z',
                creatorAlias: 'User3',
                maxParticipants: 8,
                participantCount: 3,
                categories: [
                    { id: 3, name: 'Geography' }
                ],
                bannedUsers: []
            }
        ]);
    });

    it('should handle banned users with null alias gracefully', async () => {
        db.executeQuery.mockResolvedValue([
            {
                matchId: 3,
                joinCode: 'JOIN333',
                startedDatetime: '2024-05-01T13:00:00Z',
                categoryId: 2,
                categoryName: 'Celebrities',
                creatorAlias: 'User3',
                maxParticipants: 10,
                participantCount: 4,
                bannedUserId: 99,
                bannedUserAlias: null,
            }
        ]);
    
        await getAllPublicLobbies(req, res);
    
        expect(res.json).toHaveBeenCalledWith([
            {
                matchId: 3,
                joinCode: 'JOIN333',
                startedDatetime: '2024-05-01T13:00:00Z',
                creatorAlias: 'User3',
                maxParticipants: 10,
                participantCount: 4,
                categories: [{ id: 2, name: 'Celebrities' }],
                bannedUsers: [{ id: 99, alias: null }]
            }
        ]);
    });
    
    

    it('should deduplicate banned users across multiple rows', async () => {
        db.executeQuery.mockResolvedValue([
            {
                matchId: 1,
                joinCode: 'JOIN123',
                startedDatetime: '2024-05-01T10:00:00Z',
                categoryId: 1,
                categoryName: 'General Knowledge',
                creatorAlias: 'User1',
                maxParticipants: 10,
                participantCount: 4,
                bannedUserId: 6,
                bannedUserAlias: 'User6',
            },
            {
                matchId: 1,
                joinCode: 'JOIN123',
                startedDatetime: '2024-05-01T10:00:00Z',
                categoryId: 2,
                categoryName: 'Movies & TV',
                creatorAlias: 'User1',
                maxParticipants: 10,
                participantCount: 4,
                bannedUserId: 6,
                bannedUserAlias: 'User6', 
            }
        ]);
    
        await getAllPublicLobbies(req, res);
    
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([
            {
                matchId: 1,
                joinCode: 'JOIN123',
                startedDatetime: '2024-05-01T10:00:00Z',
                creatorAlias: 'User1',
                maxParticipants: 10,
                participantCount: 4,
                categories: [
                    { id: 1, name: 'General Knowledge' },
                    { id: 2, name: 'Movies & TV' }
                ],
                bannedUsers: [
                    { id: 6, alias: 'User6' }
                ]
            }
        ]);
    });

    it('should return 404 if no public lobbies are found', async () => {
        db.executeQuery.mockResolvedValue([]);
        await getAllPublicLobbies(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'No public lobbies found' });
    });

    it('should return 503 for connection errors', async () => {
        const error = new Error('Connection refused');
        error.code = 'ECONNREFUSED';
        error.isConnectionError = true;
        db.executeQuery.mockRejectedValue(error);

        await getAllPublicLobbies(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Internal Server Error',
            reason: 'Connection refused',
        });
    });

    it('should return 500 for unexpected errors', async () => {
        const error = new Error('Unexpected DB failure');
        db.executeQuery.mockRejectedValue(error);

        await getAllPublicLobbies(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Internal Server Error',
            reason: 'Unexpected DB failure',
        });
    });

    it('should mask error reason in production', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        try {
            const error = new Error('Sensitive failure info');
            db.executeQuery.mockRejectedValue(error);

            await getAllPublicLobbies(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Internal Server Error',
                reason: 'An unexpected error occurred. Please try again later.',
            });
        } finally {
            process.env.NODE_ENV = originalEnv;
        }
    });
});
