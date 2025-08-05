// search.ts
import { pipeline } from '@xenova/transformers';
import { JournalEntry } from '../../types';

export const searchEntries = async (query: string, entries: JournalEntry[]) => {
  try {
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    
    // Generate embeddings
    const queryEmbedding = await extractor(query, { pooling: 'mean', normalize: true });
    
    // Score each entry
    const scoredEntries = await Promise.all(
      entries.map(async entry => {
        const text = entry.content;
        const textEmbedding = await extractor(text, { pooling: 'mean', normalize: true });
        
        // Simple cosine similarity
        let score = 0;
        for (let i = 0; i < queryEmbedding.data.length; i++) {
          score += queryEmbedding.data[i] * textEmbedding.data[i];
        }
        
        return { ...entry, score };
      })
    );
    
    // Sort by score and return top 10
    return scoredEntries
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  } catch (err) {
    console.error('Search failed:', err);
    // Fallback to simple text search
    const queryLower = query.toLowerCase();
    return entries.filter(entry => 
      entry.content.toLowerCase().includes(queryLower)
    ).slice(0, 10);
  }
};
