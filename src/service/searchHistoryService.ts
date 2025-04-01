import { SearchHistoryEntry } from '../types/data/SearchHistoryEntry';
import { FixedFIFOQueue } from '../types/helpers/FixedFIFOQueue';

const history : FixedFIFOQueue<SearchHistoryEntry> = new FixedFIFOQueue(10);

const searchHistoryService = {
    addItem : (entry : SearchHistoryEntry) : void => {
        history.enqueue(entry);
    },

    getHistory : () : SearchHistoryEntry[] => {
        return history.getItems();
    }
}

export default searchHistoryService;