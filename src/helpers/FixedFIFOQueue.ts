export class FixedFIFOQueue<T> {
    private queue: T[] = [];
    private maxSize: number;
  
    constructor(maxSize: number) {
        this.maxSize = maxSize;
    }
  
    enqueue(item: T): void {
        if (this.queue.length >= this.maxSize) {
            this.queue.shift(); // Remove the oldest item
        }
        this.queue.push(item);
    }
  
    dequeue(): T | undefined {
        return this.queue.shift(); // Remove and return the oldest item
    }
  
    peek(): T | undefined {
        return this.queue[0]; // Check the oldest item without removing it
    }
  
    size(): number {
        return this.queue.length;
    }
  
    isEmpty(): boolean {
        return this.queue.length === 0;
    }
  
    getItems(): T[] {
        return [...this.queue]; // Return a copy of the queue
    }
}
  