import { 
  users, 
  consultationSessions, 
  diagnoses, 
  conversationEntries,
  type User, 
  type InsertUser,
  type ConsultationSession,
  type InsertConsultationSession,
  type Diagnosis,
  type InsertDiagnosis,
  type ConversationEntry,
  type InsertConversationEntry
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Consultation Sessions
  createSession(session: InsertConsultationSession): Promise<ConsultationSession>;
  getSession(sessionId: string): Promise<ConsultationSession | undefined>;
  updateSession(sessionId: string, updates: Partial<ConsultationSession>): Promise<ConsultationSession | undefined>;
  
  // Diagnoses
  createDiagnosis(diagnosis: InsertDiagnosis): Promise<Diagnosis>;
  getDiagnosesBySession(sessionId: string): Promise<Diagnosis[]>;
  
  // Conversation History
  addConversationEntry(entry: InsertConversationEntry): Promise<ConversationEntry>;
  getConversationHistory(sessionId: string): Promise<ConversationEntry[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<string, ConsultationSession>;
  private diagnoses: Map<number, Diagnosis>;
  private conversations: Map<number, ConversationEntry>;
  private currentUserId: number;
  private currentDiagnosisId: number;
  private currentConversationId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.diagnoses = new Map();
    this.conversations = new Map();
    this.currentUserId = 1;
    this.currentDiagnosisId = 1;
    this.currentConversationId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createSession(insertSession: InsertConsultationSession): Promise<ConsultationSession> {
    const id = this.sessions.size + 1;
    const session: ConsultationSession = {
      id,
      ...insertSession,
      patientInfo: insertSession.patientInfo || null,
      symptoms: insertSession.symptoms || null,
      aiAnalysis: insertSession.aiAnalysis || null,
      conversationHistory: insertSession.conversationHistory || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sessions.set(insertSession.sessionId, session);
    return session;
  }

  async getSession(sessionId: string): Promise<ConsultationSession | undefined> {
    return this.sessions.get(sessionId);
  }

  async updateSession(sessionId: string, updates: Partial<ConsultationSession>): Promise<ConsultationSession | undefined> {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates, updatedAt: new Date() };
    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  async createDiagnosis(insertDiagnosis: InsertDiagnosis): Promise<Diagnosis> {
    const id = this.currentDiagnosisId++;
    const diagnosis: Diagnosis = {
      id,
      ...insertDiagnosis,
      description: insertDiagnosis.description || null,
      confidence: insertDiagnosis.confidence || null,
      category: insertDiagnosis.category || null,
      redFlags: insertDiagnosis.redFlags || null,
      recommendedTests: insertDiagnosis.recommendedTests || null,
      createdAt: new Date(),
    };
    this.diagnoses.set(id, diagnosis);
    return diagnosis;
  }

  async getDiagnosesBySession(sessionId: string): Promise<Diagnosis[]> {
    return Array.from(this.diagnoses.values()).filter(
      (diagnosis) => diagnosis.sessionId === sessionId
    );
  }

  async addConversationEntry(insertEntry: InsertConversationEntry): Promise<ConversationEntry> {
    const id = this.currentConversationId++;
    const entry: ConversationEntry = {
      id,
      ...insertEntry,
      timestamp: new Date(),
    };
    this.conversations.set(id, entry);
    return entry;
  }

  async getConversationHistory(sessionId: string): Promise<ConversationEntry[]> {
    return Array.from(this.conversations.values())
      .filter((entry) => entry.sessionId === sessionId)
      .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createSession(insertSession: InsertConsultationSession): Promise<ConsultationSession> {
    // Check if session already exists
    const existingSession = await this.getSession(insertSession.sessionId);
    if (existingSession) {
      // Update existing session instead of creating new one
      return await this.updateSession(insertSession.sessionId, insertSession) || existingSession;
    }
    
    const [session] = await db
      .insert(consultationSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getSession(sessionId: string): Promise<ConsultationSession | undefined> {
    const [session] = await db
      .select()
      .from(consultationSessions)
      .where(eq(consultationSessions.sessionId, sessionId));
    return session || undefined;
  }

  async updateSession(sessionId: string, updates: Partial<ConsultationSession>): Promise<ConsultationSession | undefined> {
    const [session] = await db
      .update(consultationSessions)
      .set(updates)
      .where(eq(consultationSessions.sessionId, sessionId))
      .returning();
    return session || undefined;
  }

  async createDiagnosis(insertDiagnosis: InsertDiagnosis): Promise<Diagnosis> {
    const [diagnosis] = await db
      .insert(diagnoses)
      .values(insertDiagnosis)
      .returning();
    return diagnosis;
  }

  async getDiagnosesBySession(sessionId: string): Promise<Diagnosis[]> {
    return await db
      .select()
      .from(diagnoses)
      .where(eq(diagnoses.sessionId, sessionId));
  }

  async addConversationEntry(insertEntry: InsertConversationEntry): Promise<ConversationEntry> {
    const [entry] = await db
      .insert(conversationEntries)
      .values(insertEntry)
      .returning();
    return entry;
  }

  async getConversationHistory(sessionId: string): Promise<ConversationEntry[]> {
    return await db
      .select()
      .from(conversationEntries)
      .where(eq(conversationEntries.sessionId, sessionId))
      .orderBy(conversationEntries.timestamp);
  }
}

export const storage = new DatabaseStorage();
