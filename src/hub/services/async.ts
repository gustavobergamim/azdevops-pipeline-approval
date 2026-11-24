/** Splits an array into chunks of at most `size` items. */
export function chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
}

/** Maps items with at most `concurrency` calls in flight, keeping the input order in the result. */
export async function mapWithConcurrency<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = new Array<R>(items.length);
    let next = 0;
    const worker = async () => {
        while (next < items.length) {
            const index = next++;
            results[index] = await mapper(items[index]);
        }
    };
    const workers = new Array(Math.max(1, Math.min(concurrency, items.length))).fill(0).map(() => worker());
    await Promise.all(workers);
    return results;
}

/** Extracts a readable message from a REST or JavaScript error. */
export function errorMessage(error: any): string {
    if (!error) return "Unknown error.";
    if (typeof error === "string") return error;
    const serverMessage = error.serverError && error.serverError.message;
    return serverMessage || error.message || String(error);
}
