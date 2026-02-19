jest.mock('dotenv');
jest.mock('ioredis', () => jest.requireActual('ioredis-mock'));
jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('$2b$10$mockedhash'),
    compare: jest.fn().mockResolvedValue(false),
}));

beforeEach(() => {
    jest.clearAllMocks();
});
