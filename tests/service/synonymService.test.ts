import { v4 as uuidv4 } from 'uuid';

import iplayerService from '../../src/service/iplayerService';
import synonymService from '../../src/service/synonymService'
import { Synonym } from '../../src/types/Synonym';

const mockStorageData: Record<string, any> = {};
jest.mock('../../src/types/QueuedStorage', () => {
    const mockStorageInstance = {
        getItem: jest.fn((key: string) => {
            return Promise.resolve(mockStorageData[key])
        }),
        setItem: jest.fn((key: string, value: any) => {
            mockStorageData[key] = value;
            return Promise.resolve();
        })
    };
    return {
        QueuedStorage: jest.fn(() => mockStorageInstance),
        __esModule: true
    };
});

jest.mock('../../src/service/iplayerService', () => ({
    __esModule: true,
    default: {
        removeFromSearchCache: jest.fn()
    }
}));

jest.mock('uuid', () => ({
    v4: jest.fn()
}));

beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStorageData).forEach(k => delete mockStorageData[k]);
});

describe('synonymService', () => {
    const testSynonym: Synonym = {
        id: '123',
        from: 'BBC',
        target: 'British Broadcasting Corporation',
        exemptions: ''
    };

    describe('getAllSynonyms', () => {
        it('should return all synonyms', async () => {
            mockStorageData['synonyms'] = [testSynonym];
            const result = await synonymService.getAllSynonyms();
            expect(result).toEqual([testSynonym]);
        });

        it('should return an empty array if no synonyms exist', async () => {
            const result = await synonymService.getAllSynonyms();
            expect(result).toEqual([]);
        });
    });

    describe('getSynonym', () => {
        it('should return a synonym matching by from field', async () => {
            mockStorageData['synonyms'] = [testSynonym];
            const result = await synonymService.getSynonym('BBC');
            expect(result).toEqual(testSynonym);
        });

        it('should return a synonym matching by target field', async () => {
            mockStorageData['synonyms'] = [testSynonym];
            const result = await synonymService.getSynonym('British Broadcasting Corporation');
            expect(result).toEqual(testSynonym);
        });

        it('should return undefined if no match', async () => {
            mockStorageData['synonyms'] = [testSynonym];
            const result = await synonymService.getSynonym('ITV');
            expect(result).toBeUndefined();
        });
    });

    describe('addSynonym', () => {
        it('should assign an id if missing and add the synonym', async () => {
            const newSyn: Synonym = { from: 'ITV', target: 'Independent Television' } as Synonym;
            (uuidv4 as jest.Mock).mockReturnValue('generated-id');
            await synonymService.addSynonym(newSyn);
            const saved = mockStorageData['synonyms'];
            expect(saved.length).toBe(1);
            expect(saved[0].id).toBe('generated-id');
            expect(iplayerService.removeFromSearchCache).toHaveBeenCalledWith('Independent Television');
        });

        it('should keep existing id and add the synonym', async () => {
            const syn: Synonym = { id: 'existing-id', from: 'C4', target: 'Channel 4', exemptions: '' };
            await synonymService.addSynonym(syn);
            const saved = mockStorageData['synonyms'];
            expect(saved[0].id).toBe('existing-id');
        });
    });

    describe('updateSynonym', () => {
        it('should remove existing and re-add updated synonym', async () => {
            mockStorageData['synonyms'] = [testSynonym];
            const updated = { ...testSynonym, target: 'Updated Target' };

            await synonymService.updateSynonym(updated);
            const saved = mockStorageData['synonyms'];
            expect(saved).toHaveLength(1);
            expect(saved[0].target).toBe('Updated Target');
            expect(iplayerService.removeFromSearchCache).toHaveBeenCalledWith('Updated Target');
        });
    });

    describe('removeSynonym', () => {
        it('should remove a synonym and call removeFromSearchCache', async () => {
            mockStorageData['synonyms'] = [testSynonym];
            await synonymService.removeSynonym('123');
            expect(mockStorageData['synonyms']).toHaveLength(0);
            expect(iplayerService.removeFromSearchCache).toHaveBeenCalledWith(testSynonym.target);
        });

        it('should do nothing if id not found', async () => {
            mockStorageData['synonyms'] = [testSynonym];
            await synonymService.removeSynonym('not-found');
            expect(mockStorageData['synonyms']).toHaveLength(1);
            expect(iplayerService.removeFromSearchCache).not.toHaveBeenCalled();
        });
    });
});
