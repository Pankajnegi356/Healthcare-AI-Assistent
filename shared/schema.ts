import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const consultationSessions = pgTable("consultation_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  mode: text("mode").notNull(), // 'doctor' | 'patient'
  patientInfo: jsonb("patient_info"),
  symptoms: text("symptoms"),
  aiAnalysis: jsonb("ai_analysis"),
  conversationHistory: jsonb("conversation_history"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const diagnoses = pgTable("diagnoses", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  confidence: integer("confidence"),
  category: text("category"),
  redFlags: jsonb("red_flags"),
  recommendedTests: jsonb("recommended_tests"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversationEntries = pgTable("conversation_entries", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  type: text("type").notNull(), // 'user' | 'ai'
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertConsultationSessionSchema = createInsertSchema(consultationSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDiagnosisSchema = createInsertSchema(diagnoses).omit({
  id: true,
  createdAt: true,
});

export const insertConversationEntrySchema = createInsertSchema(conversationEntries).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ConsultationSession = typeof consultationSessions.$inferSelect;
export type InsertConsultationSession = z.infer<typeof insertConsultationSessionSchema>;
export type Diagnosis = typeof diagnoses.$inferSelect;
export type InsertDiagnosis = z.infer<typeof insertDiagnosisSchema>;
export type ConversationEntry = typeof conversationEntries.$inferSelect;
export type InsertConversationEntry = z.infer<typeof insertConversationEntrySchema>;
