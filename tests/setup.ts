jest.mock('dotenv');
jest.mock('ioredis', () => jest.requireActual('ioredis-mock'));

beforeEach(() => {
    jest.clearAllMocks();
});
