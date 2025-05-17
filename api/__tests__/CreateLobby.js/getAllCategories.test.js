const { getAllCategories } = require('../../handlers/CreateLobby');
const queries = require('../../queries/createLobby');

jest.mock('../../queries/createLobby', () => ({
    getAllCategoriesFromDb: jest.fn()
}));

describe('getAllCategories', () => {
    let req, res, next;

    beforeEach(() => {
        req = {};
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return categories as JSON with status 200', async () => {
        const mockData = [{ id: 1, name: 'General Knowledge' }];
        queries.getAllCategoriesFromDb.mockResolvedValue(mockData);

        await getAllCategories(req, res, next);

        expect(queries.getAllCategoriesFromDb).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it('should return 404 if no categories are found', async () => {
        queries.getAllCategoriesFromDb.mockResolvedValue([]);

        await getAllCategories(req, res, next);

        const thrownError = next.mock.calls[0][0];
        expect(thrownError).toBeInstanceOf(Error);
        expect(thrownError.message).toBe('No categories found');
        expect(thrownError.status).toBe(404);
    });

    it('should return 503 for connection errors', async () => {
        const error = new Error('Connection refused');
        error.code = 'ECONNREFUSED';
        error.isConnectionError = true;

        queries.getAllCategoriesFromDb.mockRejectedValue(error);

        await getAllCategories(req, res, next);

        const thrownError = next.mock.calls[0][0];
        expect(thrownError).toBeInstanceOf(Error);
        expect(thrownError.message).toBe('An unexpected error occurred');
        expect(thrownError.status).toBe(503);
    });

    it('should return 500 for other errors', async () => {
        const error = new Error('Unexpected DB failure');
        queries.getAllCategoriesFromDb.mockRejectedValue(error);

        await getAllCategories(req, res, next);

        const thrownError = next.mock.calls[0][0];
        expect(thrownError).toBeInstanceOf(Error);
        expect(thrownError.message).toBe('An unexpected error occurred');
        expect(thrownError.status).toBe(500);
    });

    it('should return safe error message in production', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        try {
            const error = new Error('Sensitive failure info');
            queries.getAllCategoriesFromDb.mockRejectedValue(error);

            await getAllCategories(req, res, next);

            const thrownError = next.mock.calls[0][0];
            expect(thrownError).toBeInstanceOf(Error);
            expect(thrownError.message).toBe('An unexpected error occurred');
            expect(thrownError.status).toBe(500);
        } finally {
            process.env.NODE_ENV = originalEnv;
        }
    });
});
