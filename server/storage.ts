import { 
  users, cases, evidences, reportedNumbers, botInteractions,
  type User, type InsertUser,
  type Case, type InsertCase,
  type Evidence, type InsertEvidence,
  type ReportedNumber, type InsertReportedNumber,
  type BotInteraction, type InsertBotInteraction
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sql, and, gte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getActiveUsers(): Promise<(User & { lastActive: string })[]>;

  // Cases
  getCase(id: number): Promise<(Case & { user: User | null; evidences: Evidence[] }) | undefined>;
  getCases(limit?: number, offset?: number, status?: string): Promise<(Case & { user: User | null })[]>;
  createCase(data: InsertCase): Promise<Case>;
  updateCaseStatus(id: number, status: string): Promise<Case | undefined>;
  
  // Stats
  getDashboardStats(): Promise<{
    totalUsers: number;
    totalCases: number;
    activeUsers: number;
    newCasesToday: number;
    casesInProcess: number;
    totalAmountLost: number;
    casesResolved: number;
  }>;
  getStatsByType(): Promise<{ type: string; count: number }[]>;
  getStatsHistory(): Promise<{ date: string; count: number }[]>;

  // Reported Numbers
  getTopReportedNumbers(limit?: number): Promise<ReportedNumber[]>;
  createReportedNumber(data: InsertReportedNumber): Promise<ReportedNumber>;

  // Chat
  getMessages(caseId: number): Promise<Message[]>;
  createMessage(data: { caseId: number; senderId?: number; content: string; fromAdmin?: boolean }): Promise<Message>;

  // Evidences
  createEvidence(data: InsertEvidence): Promise<Evidence>;
  getEvidencesByCaseId(caseId: number): Promise<Evidence[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getActiveUsers(): Promise<(User & { lastActive: string })[]> {
    // Mocking active users as recently created or updated users
    // In a real app with sessions, we'd query session table
    const recentUsers = await db.select()
      .from(users)
      .orderBy(desc(users.updatedAt))
      .limit(5);
    
    return recentUsers.map(u => ({
      ...u,
      lastActive: u.updatedAt ? u.updatedAt.toISOString() : new Date().toISOString()
    }));
  }

  async getCase(id: number): Promise<(Case & { user: User | null; evidences: Evidence[] }) | undefined> {
    const [foundCase] = await db.select().from(cases).where(eq(cases.id, id));
    if (!foundCase) return undefined;

    const [user] = foundCase.userId ? await db.select().from(users).where(eq(users.id, foundCase.userId)) : [undefined];
    const caseEvidences = await db.select().from(evidences).where(eq(evidences.caseId, id));

    return { ...foundCase, user: user || null, evidences: caseEvidences };
  }

  async getCases(limit = 50, offset = 0, status?: string): Promise<(Case & { user: User | null })[]> {
    let query = db.select().from(cases).limit(limit).offset(offset).orderBy(desc(cases.createdAt));
    
    if (status) {
      // @ts-ignore - dynamic query construction
      query = query.where(eq(cases.status, status));
    }

    const results = await query;
    
    const casesWithUser = await Promise.all(results.map(async (c) => {
      const [user] = c.userId ? await db.select().from(users).where(eq(users.id, c.userId)) : [undefined];
      return { ...c, user: user || null };
    }));

    return casesWithUser;
  }

  async createCase(data: InsertCase): Promise<Case> {
    // Generate case number: CASE-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    const caseNumber = `CASE-${dateStr}-${randomSuffix}`;

    const [newCase] = await db.insert(cases).values({ ...data, caseNumber }).returning();
    return newCase;
  }

  async updateCaseStatus(id: number, status: string): Promise<Case | undefined> {
    const [updatedCase] = await db.update(cases)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(cases.id, id))
      .returning();
    return updatedCase;
  }

  async getDashboardStats() {
    const [totalUsersRes] = await db.select({ count: count() }).from(users);
    const [totalCasesRes] = await db.select({ count: count() }).from(cases);
    const [newCasesTodayRes] = await db.select({ count: count() }).from(cases)
      .where(sql`created_at >= CURRENT_DATE`);
    
    // In progress cases
    const [casesInProcessRes] = await db.select({ count: count() }).from(cases)
      .where(eq(cases.status, "en_proceso"));

    // Resolved cases
    const [casesResolvedRes] = await db.select({ count: count() }).from(cases)
      .where(eq(cases.status, "resuelto"));
    
    // Sum amount lost
    const [totalLostRes] = await db.select({ total: sql<number>`sum(amount_lost)` }).from(cases);

    return {
      totalUsers: Number(totalUsersRes?.count || 0),
      totalCases: Number(totalCasesRes?.count || 0),
      activeUsers: 5, // Mock value or fetch from sessions
      newCasesToday: Number(newCasesTodayRes?.count || 0),
      casesInProcess: Number(casesInProcessRes?.count || 0),
      totalAmountLost: Number(totalLostRes?.total || 0),
      casesResolved: Number(casesResolvedRes?.count || 0),
    };
  }

  async getStatsByType() {
    const results = await db.select({
      type: cases.type,
      count: count(),
    })
    .from(cases)
    .groupBy(cases.type);

    return results.map(r => ({ type: r.type || "unknown", count: Number(r.count) }));
  }

  async getStatsHistory() {
    // Last 7 days
    const results = await db.execute(sql`
      SELECT to_char(created_at, 'YYYY-MM-DD') as date, count(*) as count
      from cases
      where created_at > current_date - interval '7 days'
      group by 1
      order by 1 asc
    `);

    return results.rows.map((r: any) => ({ date: r.date, count: Number(r.count) }));
  }

  async getTopReportedNumbers(limit = 10): Promise<ReportedNumber[]> {
    return await db.select().from(reportedNumbers)
      .orderBy(desc(reportedNumbers.reportCount))
      .limit(limit);
  }

  async createReportedNumber(data: InsertReportedNumber): Promise<ReportedNumber> {
    const [newReport] = await db.insert(reportedNumbers).values(data).returning();
    return newReport;
  }

  async getMessages(caseId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.caseId, caseId))
      .orderBy(messages.createdAt);
  }

  async createMessage(data: { caseId: number; senderId?: number; content: string; fromAdmin?: boolean }): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(data).returning();
    return newMessage;
  }

  async createEvidence(data: InsertEvidence): Promise<Evidence> {
    const [newEvidence] = await db.insert(evidences).values(data).returning();
    return newEvidence;
  }

  async getEvidencesByCaseId(caseId: number): Promise<Evidence[]> {
    return await db.select().from(evidences).where(eq(evidences.caseId, caseId));
  }
}

export const storage = new DatabaseStorage();
