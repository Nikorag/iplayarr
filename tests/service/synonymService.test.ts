import { v4 as uuidv4 } from 'uuid';

import searchFacade from '../../server/facade/searchFacade';
import synonymService from '../../server/service/synonymService';
import { Synonym } from '../../server/types/Synonym';

const mockStorageData: Record<string, any> = {};
jest.mock('../../server/types/QueuedStorage', () => {
    const mockStorageInstance = {
        getItem: jest.fn((key: string) => {
            return Promise.resolve(mockStorageData[key]);
        }),
        setItem: jest.fn((key: string, value: any) => {
            mockStorageData[key] = value;
            return Promise.resolve();
        }),
    };
    return {
        QueuedStorage: jest.fn(() => mockStorageInstance),
        __esModule: true,
    };
});

jest.mock('../../server/facade/searchFacade', () => ({
    __esModule: true,
    default: {
        removeFromSearchCache: jest.fn(),
    },
}));

jest.mock('uuid', () => ({
    v4: jest.fn(),
}));

beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStorageData).forEach((k) => delete mockStorageData[k]);
});

describe('synonymService', () => {
    const testSynonym: Synonym = {
        id: '123',
        from: 'BBC',
        target: 'British Broadcasting Corporation',
        exemptions: '',
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

        it('should not match on target when fromOnly is set', async () => {
            mockStorageData['synonyms'] = [testSynonym];
            expect(await synonymService.getSynonym('British Broadcasting Corporation', { fromOnly: true })).toBeUndefined();
            expect(await synonymService.getSynonym('BBC', { fromOnly: true })).toEqual(testSynonym);
        });

        describe('tolerant matching', () => {
            const synonym = (from: string, target: string): Synonym => ({ id: from, from, target, exemptions: '' }) as Synonym;

            it.each([
                ['Him and Her', 'Him & Her'],
                ['Him & Her', 'Him and Her'],
                ['apprentice-uk', 'Apprentice UK'],
                ['The Apprentice, UK', 'the apprentice uk'],
                ['Cafe Show', 'Café Show'],
                ['Welsh Language on Tour (2020)', 'Welsh Language on Tour'],
                ['Welsh Language on Tour 2020', 'Welsh Language on Tour'],
            ])('matches a search for %p to a synonym saved as %p', async (input, saved) => {
                const expected = synonym(saved, 'Anything');
                mockStorageData['synonyms'] = [expected];

                expect(await synonymService.getSynonym(input)).toEqual(expected);
            });

            it('matches the target in the same tolerant way', async () => {
                const expected = synonym('From', 'Iaith ar Daith');
                mockStorageData['synonyms'] = [expected];

                expect(await synonymService.getSynonym('iaith-ar-daith')).toEqual(expected);
            });

            it('prefers the closest match over a looser one', async () => {
                const generic = synonym('Doctor Who', 'Doctor Who (generic)');
                const specific = synonym('Doctor Who 2005', 'Doctor Who (2005)');
                mockStorageData['synonyms'] = [generic, specific];

                expect(await synonymService.getSynonym('Doctor Who 2005')).toEqual(specific);
                expect(await synonymService.getSynonym('doctor who')).toEqual(generic);
            });

            it('does not match titles that merely contain each other', async () => {
                mockStorageData['synonyms'] = [synonym('Him', 'Himself')];

                expect(await synonymService.getSynonym('Him and Her')).toBeUndefined();
                expect(await synonymService.getSynonym('Hi')).toBeUndefined();
            });

            it('does not treat a different year as a match for a synonym saved with one', async () => {
                mockStorageData['synonyms'] = [synonym('Doctor Who 2005', 'Doctor Who (2005)')];

                expect(await synonymService.getSynonym('Doctor Who 1963')).toBeUndefined();
            });

            it('does not match when the search is only punctuation', async () => {
                mockStorageData['synonyms'] = [synonym('*', '*')];

                expect(await synonymService.getSynonym(' - ')).toBeUndefined();
            });

            it('keeps non-Latin titles distinct', async () => {
                mockStorageData['synonyms'] = [synonym('Привет', 'Hello')];

                expect(await synonymService.getSynonym('ЭВМ')).toBeUndefined();
                expect((await synonymService.getSynonym('привет'))?.target).toBe('Hello');
            });
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
            expect(searchFacade.removeFromSearchCache).toHaveBeenCalledWith('Independent Television');
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
            expect(searchFacade.removeFromSearchCache).toHaveBeenCalledWith('Updated Target');
        });
    });

    describe('removeSynonym', () => {
        it('should remove a synonym and call removeFromSearchCache', async () => {
            mockStorageData['synonyms'] = [testSynonym];
            await synonymService.removeSynonym('123');
            expect(mockStorageData['synonyms']).toHaveLength(0);
            expect(searchFacade.removeFromSearchCache).toHaveBeenCalledWith(testSynonym.target);
        });

        it('should do nothing if id not found', async () => {
            mockStorageData['synonyms'] = [testSynonym];
            await synonymService.removeSynonym('not-found');
            expect(mockStorageData['synonyms']).toHaveLength(1);
            expect(searchFacade.removeFromSearchCache).not.toHaveBeenCalled();
        });
    });
});
