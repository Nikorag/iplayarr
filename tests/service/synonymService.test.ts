import storage from 'node-persist';

import synonymService from '../../src/service/synonymService';
import { Synonym } from '../../src/types/Synonym';

jest.mock('node-persist', () => {
    const mockStorage: any = {
        init: jest.fn(async () => { }),
        getItem: jest.fn(async (key: string) => {
            if (key === 'synonyms') {
                return mockStorage.synonyms;
            }
            return undefined;
        }),
        setItem: jest.fn(async (key: string, value: any) => {
            if (key === 'synonyms') {
                mockStorage.synonyms = value;
            }
        }),
        removeItem: jest.fn(async (key: string) => {
            if (key === 'synonyms') {
                delete mockStorage.synonyms;
            }
        }),
        synonyms: [] as any,
    };
    return mockStorage;
});

describe('synonymService', () => {
    beforeEach(async () => {
        (storage.setItem as jest.Mock).mockClear();
        (storage.getItem as jest.Mock).mockClear();
        (storage as any).synonyms = [];
        await storage.init();
        (storage.getItem as jest.Mock).mockImplementation(async (key: string) => {
            if (key === 'synonyms') {
                return (storage as any).synonyms;
            }
            return undefined;
        });
    });

    it('should get all synonyms', async () => {
        (storage as any).synonyms = [{ id: '1', from: 'old', target: 'new' }];
        const synonyms = await synonymService.getAllSynonyms();
        expect(synonyms).toEqual([{ id: '1', from: 'old', target: 'new' }]);
    });

    it('should get a synonym by "from"', async () => {
        (storage as any).synonyms = [{ id: '1', from: 'old', target: 'new' }];
        const synonym = await synonymService.getSynonym('old');
        expect(synonym).toEqual({ id: '1', from: 'old', target: 'new' });
    });

    it('should return undefined if synonym is not found', async () => {
        (storage as any).synonyms = [{ id: '1', from: 'old', target: 'new' }];
        const synonym = await synonymService.getSynonym('nonexistent');
        expect(synonym).toBeUndefined();
    });

    it('should add a synonym', async () => {
        const newSynonym: Synonym = { id : '', from: 'test', target: 'test2', exemptions : '' };
        await synonymService.addSynonym(newSynonym);
        expect((storage.setItem as jest.Mock).mock.calls[0][0]).toBe('synonyms');
        const savedSynonyms = (storage.setItem as jest.Mock).mock.calls[0][1];
        expect(savedSynonyms).toEqual(expect.arrayContaining([expect.objectContaining(newSynonym)]));
    });

    it('should remove a synonym', async () => {
        (storage as any).synonyms = [{ id: '1', from: 'old', target: 'new' }];
        await synonymService.removeSynonym('1');
        expect((storage.setItem as jest.Mock).mock.calls[0][0]).toBe('synonyms');
        expect((storage.setItem as jest.Mock).mock.calls[0][1]).toEqual([]);
    });
});