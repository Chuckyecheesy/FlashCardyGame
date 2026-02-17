import { integer, pgTable, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";

// Flashcard decks table - each deck contains multiple cards on a specific topic
export const decksTable = pgTable("flashcard_decks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(), // e.g., "Indonesian Language", "British History"
  description: text(), // Optional description of what the deck covers
  user_id: varchar({ length: 255 }).notNull(), // Clerk user ID
  is_public: boolean().default(false).notNull(), // Whether other users can view/study this deck
  created_at: timestamp().defaultNow().notNull(),
  updated_at: timestamp().defaultNow().notNull(),
});

// Individual flashcards table - each card belongs to a deck
export const cardsTable = pgTable("flashcard_cards", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  front: text().notNull(), // e.g., "Dog" or "When was the battle of hastings?"
  back: text().notNull(), // e.g., "Anjing" or "1066"
  deck_id: integer().notNull().references(() => decksTable.id, { onDelete: "cascade" }),
  order: integer().default(0).notNull(), // Order of cards within the deck
  created_at: timestamp().defaultNow().notNull(),
  updated_at: timestamp().defaultNow().notNull(),
});

// Study sessions table to track user progress and performance
export const studySessionsTable = pgTable("flashcard_study_sessions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_id: varchar({ length: 255 }).notNull(), // Clerk user ID
  deck_id: integer().notNull().references(() => decksTable.id, { onDelete: "cascade" }),
  card_id: integer().notNull().references(() => cardsTable.id, { onDelete: "cascade" }),
  correct: boolean().notNull(), // Whether the user answered correctly
  response_time: integer(), // Time taken to answer in milliseconds (optional)
  studied_at: timestamp().defaultNow().notNull(),
});

// Card statistics table to track performance metrics per card per user
export const cardStatsTable = pgTable("flashcard_card_stats", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_id: varchar({ length: 255 }).notNull(), // Clerk user ID
  card_id: integer().notNull().references(() => cardsTable.id, { onDelete: "cascade" }),
  correct_count: integer().default(0).notNull(), // Number of times answered correctly
  incorrect_count: integer().default(0).notNull(), // Number of times answered incorrectly
  last_studied: timestamp(), // When this card was last studied
  next_review: timestamp(), // When this card should be reviewed next (for spaced repetition)
  difficulty: integer().default(1).notNull(), // Difficulty level (1-5, for spaced repetition algorithms)
  created_at: timestamp().defaultNow().notNull(),
  updated_at: timestamp().defaultNow().notNull(),
});