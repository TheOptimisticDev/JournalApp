// sentiment.ts
import { pipeline } from '@xenova/transformers';

type SentimentResult = {
  label: string;
  score: number;
};

type ClassifierResult = {
  label: string;
  score: number;
} | {
  label: string;
  score: number;
}[];

export const analyzeSentiment = async (text: string): Promise<SentimentResult> => {
  try {
    const classifier = await pipeline(
      'text-classification',
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
    );
    const result = await classifier(text) as ClassifierResult;
    
    // Handle both single result and array cases
    let firstResult: { label: string; score: number };
    if (Array.isArray(result)) {
      firstResult = result[0];
    } else {
      firstResult = result;
    }
    
    return {
      label: firstResult.label.toLowerCase(),
      score: firstResult.score
    };
  } catch (error) {
    console.error('Sentiment analysis failed:', error);
    return { label: 'neutral', score: 0.5 };
  }
};

export const extractKeywords = (text: string) => {
  return text
    .toLowerCase()
    .match(/\b[a-z]{4,}\b/g)
    ?.slice(0, 5) || [];
};
