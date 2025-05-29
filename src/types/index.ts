
export const breakupTypes = [
  "Mutual",
  "Ghosted",
  "Cheated On",
  "Death of Partner",
  "Divorce",
  "Grew Apart Over Time",
  "It's Complicated",
  "Mutual but Painful",
  "One-sided Breakup",
  "Trust Issues",
  "Long-distance Relationship Ended",
  "Parental or Family Pressure",
  "Religious or Cultural Differences",
  "Abusive Relationship",
  "Manipulative or Controlling Partner",
  "Sudden and Unexpected Breakup",
  "Breakup Due to Gender/Sexual Identity Conflict",
  "Mental Health Struggles in Relationship",
  "Health-Related Breakup",
  "Financial Strain",
  "Career or Relocation Conflict",
  "Legal or Custody-related Separation",
  "First Love Ended",
  "Breakup via Text or Social Media",
  "Peer Pressure or Social Influence",
] as const;

export type BreakupType = typeof breakupTypes[number];

export interface UserProfile {
  age: number;
  genderIdentity: 'Male' | 'Female' | 'Non-Binary';
  ethnicity: string;
  vulnerableScore: number; // 0-10
  anxietyLevel: 'Low' | 'Medium' | 'High';
  breakupType: BreakupType;
  background: string;
}

export interface PersonalizedTherapyOutput {
  recommendations: string;
  identifiedTherapeuticNeeds: string[];
}

export interface AdaptedLanguageStyle {
  adaptedLanguage: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  detectedSentiment?: string; // Added for sentiment display
}
