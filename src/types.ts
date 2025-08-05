export interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  mood?: string;
  audio?: string | null;
  images?: string[];
  videos?: string[];
  reminderTime?: string;
}

export interface SentimentData {
  label: 'positive' | 'neutral' | 'negative';
  score: number;
  keywords?: string[];
}

export interface AIJournalEntry extends JournalEntry {
  sentiment?: SentimentData;
  tags?: string[];
  aiProcessed?: boolean;
}
