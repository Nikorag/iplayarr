import { FixedFIFOQueue } from 'src/helpers/FixedFIFOQueue';
import { SearchHistoryEntry } from 'src/types/data/SearchHistoryEntry';

let history : FixedFIFOQueue<SearchHistoryEntry> = new FixedFIFOQueue(10);

const searchHistoryService = {
    addItem : (entry : SearchHistoryEntry) : void => {
        history.enqueue(entry);
    },

    getHistory : () : SearchHistoryEntry[] => {
        return history.getItems();
    },

    clearHistory : () : void => {
        history = new FixedFIFOQueue(10);
    }
}

export default searchHistoryService;