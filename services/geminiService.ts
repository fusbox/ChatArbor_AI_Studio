/**
 * Simulates generating a vector embedding for a given text.
 * In a real application, this would call an embedding model like 'text-embedding-004' on the server.
 * This function remains here to be called by the mock backend service.
 * @param text The text to embed.
 * @returns A promise that resolves to a 768-dimension numerical vector.
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
    // This simulates the behavior of an embedding model, producing a deterministic vector.
    // The text-embedding-004 model creates 768-dimension vectors.
    console.warn("Simulating embedding generation. This would happen on a server in production.");
    
    // Create a pseudo-random but deterministic vector based on the text.
    // This provides consistency for the same input text.
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
        seed = (seed + text.charCodeAt(i) * (i + 1)) % 1000000;
    }
    
    let a = seed;
    const random = () => {
        a = (a * 9301 + 49297) % 233280;
        return a / 233280;
    };

    const vector = Array(768).fill(0).map(() => random() * 2 - 1);
    
    // Normalize the vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    return vector.map(v => v / magnitude);
};
