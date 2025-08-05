import { analyzeSentiment, extractKeywords } from '../ai/sentiment';
import { AIJournalEntry } from '../../types/AIJournalEntry';

type SentimentLabel = 'positive' | 'neutral' | 'negative';

interface AISummary {
  positive: number;
  neutral: number;
  negative: number;
  timeline: {
    date: string;
    mood: number;
  }[];
}

/**
 * Processes a batch of journal entries and generates a sentiment timeline and summary.
 */
export const analyzeEntries = async (
  entries: AIJournalEntry[]
): Promise<{
  enrichedEntries: (AIJournalEntry & {
    sentiment: SentimentLabel;
    score: number;
    keywords: string[];
  })[];
  summary: AISummary;
}> => {
  const enrichedEntries: (AIJournalEntry & {
    sentiment: SentimentLabel;
    score: number;
    keywords: string[];
  })[] = [];

  const summary: AISummary = {
    positive: 0,
    neutral: 0,
    negative: 0,
    timeline: [],
  };

  for (const entry of entries) {
    const sentimentResult = await analyzeSentiment(entry.content);
    const keywords = await extractKeywords(entry.content);

    // Type assertion to ensure sentiment matches SentimentLabel
    const sentiment = sentimentResult.label as SentimentLabel;
    
    const enrichedEntry = {
      ...entry,
      sentiment,
      score: sentimentResult.score,
      keywords,
    };

    enrichedEntries.push(enrichedEntry);

    summary[sentiment] += 1;

    summary.timeline.push({
      date: entry.createdAt,
      mood: sentiment === 'positive' ? 1 : sentiment === 'neutral' ? 0 : -1,
    });
  }

  return { enrichedEntries, summary };
};
