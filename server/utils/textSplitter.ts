/**
 * Recursive Character Text Splitter
 * Splits text into chunks based on a list of separators, aiming for a target chunk size
 * while maintaining context by overlapping chunks.
 */

interface TextSplitterOptions {
    chunkSize: number;
    chunkOverlap: number;
    separators?: string[];
}

export class RecursiveCharacterTextSplitter {
    private chunkSize: number;
    private chunkOverlap: number;
    private separators: string[];

    constructor(options: TextSplitterOptions = { chunkSize: 1000, chunkOverlap: 200 }) {
        this.chunkSize = options.chunkSize;
        this.chunkOverlap = options.chunkOverlap;
        this.separators = options.separators || ['\n\n', '\n', ' ', ''];
    }

    splitText(text: string): string[] {
        const finalChunks: string[] = [];
        let goodSplits: string[] = [];

        // Find the best separator to use
        let separator = this.separators[this.separators.length - 1];
        for (const s of this.separators) {
            if (text.includes(s)) {
                separator = s;
                break;
            }
        }

        // Split by the separator
        const splits = text.split(separator);

        // Merge splits into chunks
        let currentChunk: string[] = [];
        let currentLength = 0;

        for (const split of splits) {
            const splitLength = split.length;

            if (currentLength + splitLength + (currentChunk.length > 0 ? separator.length : 0) > this.chunkSize) {
                if (currentChunk.length > 0) {
                    const chunk = currentChunk.join(separator);
                    finalChunks.push(chunk);

                    // Handle overlap
                    // Keep trailing splits that fit within overlap
                    while (currentLength > this.chunkOverlap && currentChunk.length > 0) {
                        const removed = currentChunk.shift();
                        currentLength -= (removed?.length || 0) + (currentChunk.length > 0 ? separator.length : 0);
                    }
                }
            }

            currentChunk.push(split);
            currentLength += splitLength + (currentChunk.length > 1 ? separator.length : 0);
        }

        if (currentChunk.length > 0) {
            finalChunks.push(currentChunk.join(separator));
        }

        return finalChunks;
    }
}

export const splitText = (text: string, options?: Partial<TextSplitterOptions>): string[] => {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: options?.chunkSize || 1000,
        chunkOverlap: options?.chunkOverlap || 200,
        separators: options?.separators
    });
    return splitter.splitText(text);
};
