import { FixedFIFOQueue } from '../../src/types/utils/FixedFIFOQueue';

describe('FixedFIFOQueue', () => {
    it('should enqueue and dequeue in FIFO order', async () => {
        const queue = new FixedFIFOQueue<number>(3);
        await queue.enqueue(1);
        await queue.enqueue(2);
        await queue.enqueue(3);

        expect(await queue.dequeue()).toBe(1);
        expect(await queue.dequeue()).toBe(2);
        expect(await queue.dequeue()).toBe(3);
        expect(await queue.dequeue()).toBeUndefined();
    });

    it('should not exceed max size', async () => {
        const queue = new FixedFIFOQueue<number>(2);
        await queue.enqueue(1);
        await queue.enqueue(2);
        await queue.enqueue(3); // should remove 1

        const items = await queue.getItems();
        expect(items).toEqual([2, 3]);
        expect(await queue.size()).toBe(2);
    });

    it('peek should return the first item without removing it', async () => {
        const queue = new FixedFIFOQueue<string>(2);
        await queue.enqueue('a');
        expect(await queue.peek()).toBe('a');
        expect(await queue.size()).toBe(1);
    });

    it('isEmpty should return true when queue is empty', async () => {
        const queue = new FixedFIFOQueue<boolean>(1);
        expect(await queue.isEmpty()).toBe(true);
        await queue.enqueue(true);
        expect(await queue.isEmpty()).toBe(false);
        await queue.dequeue();
        expect(await queue.isEmpty()).toBe(true);
    });

    it('getItems should return a copy of the queue', async () => {
        const queue = new FixedFIFOQueue<number>(3);
        await queue.enqueue(1);
        await queue.enqueue(2);

        const items = await queue.getItems();
        expect(items).toEqual([1, 2]);

        items.push(3);
        expect(await queue.getItems()).toEqual([1, 2]); // internal state shouldn't be affected
    });
});
