import { FixedFIFOQueue } from 'src/types/FixedFIFOQueue';

describe('FixedFIFOQueue', () => {
    it('should enqueue and dequeue in FIFO order', () => {
        const queue = new FixedFIFOQueue<number>(3);
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);

        expect(queue.dequeue()).toBe(1);
        expect(queue.dequeue()).toBe(2);
        expect(queue.dequeue()).toBe(3);
        expect(queue.dequeue()).toBeUndefined();
    });

    it('should not exceed max size', () => {
        const queue = new FixedFIFOQueue<number>(2);
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3); // should remove 1

        const items = queue.getItems();
        expect(items).toEqual([2, 3]);
        expect(queue.size()).toBe(2);
    });

    it('peek should return the first item without removing it', () => {
        const queue = new FixedFIFOQueue<string>(2);
        queue.enqueue('a');
        expect(queue.peek()).toBe('a');
        expect(queue.size()).toBe(1);
    });

    it('isEmpty should return true when queue is empty', () => {
        const queue = new FixedFIFOQueue<boolean>(1);
        expect(queue.isEmpty()).toBe(true);
        queue.enqueue(true);
        expect(queue.isEmpty()).toBe(false);
        queue.dequeue();
        expect(queue.isEmpty()).toBe(true);
    });

    it('getItems should return a copy of the queue', () => {
        const queue = new FixedFIFOQueue<number>(3);
        queue.enqueue(1);
        queue.enqueue(2);

        const items = queue.getItems();
        expect(items).toEqual([1, 2]);

        items.push(3);
        expect(queue.getItems()).toEqual([1, 2]); // internal state shouldn't be affected
    });
});
