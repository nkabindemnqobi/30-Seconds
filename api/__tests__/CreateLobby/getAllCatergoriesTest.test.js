const { getAllCategories } = require('../../handlers/CreateLobby');
const db = require('../../db/query');

jest.mock('../../db/query');

describe('getAllCategories', () => {
    let req, res;

    beforeEach(() => {
        req = {};
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return categories as JSON with status 200', async () => {
        const mockData = [
            { id: 1, name: 'General Knowledge' },
            { id: 2, name: 'Celebrities' },
            { id: 3, name: 'Geography'}
        ];
        db.executeQuery.mockResolvedValue(mockData);

        await getAllCategories(req, res);

        expect(db.executeQuery).toHaveBeenCalledWith('SELECT * FROM Categories');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it('should return 404 if no categories are found', async () => {
        db.executeQuery.mockResolvedValue([]);

        await getAllCategories(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'No categories found' });
    });

    it('should return 503 for connection errors', async () => {
        const error = new Error('Connection refused');
        error.code = 'ECONNREFUSED';
        error.isConnectionError = true;

        db.executeQuery.mockRejectedValue(error);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await getAllCategories(req, res);
        consoleErrorSpy.mockRestore();

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Internal Server Error',
            reason: 'Connection refused',
        });

    });

    it('should return 500 for other errors', async () => {
        const error = new Error('Unexpected DB failure');
        db.executeQuery.mockRejectedValue(error);

        
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await getAllCategories(req, res);
        consoleErrorSpy.mockRestore();

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Internal Server Error',
            reason: 'Unexpected DB failure',
        });

    });

    it('should return safe error message in production', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        try {
            const error = new Error('Sensitive failure info');
            
            db.executeQuery.mockRejectedValue(error);
            
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            await getAllCategories(req, res);
            consoleErrorSpy.mockRestore();

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
