import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const caseStatusEnum = pgEnum("case_status", ["nuevo", "en_proceso", "denunciado", "resuelto", "cerrado"]);
export const crimeTypeEnum = pgEnum("crime_type", ["phishing", "hackeo_whatsapp", "hackeo_email", "extorsion", "otro"]);

// Users table (Victims/Admin)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").unique(),
  telegramUsername: text("telegram_username"),
  fullName: text("full_name"),
  identificationNumber: text("identification_number"),
  age: integer("age"),
  birthDate: timestamp("birth_date"),
  profession: text("profession"),
  address: text("address"),
  phoneNumber: text("phone_number"),
  role: text("role").default("user"), // user, admin
  lastIp: text("last_ip"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cases table
export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  caseNumber: text("case_number").unique().notNull(),
  type: crimeTypeEnum("type"),
  status: caseStatusEnum("status").default("nuevo"),
  description: text("description"),
  incidentDate: timestamp("incident_date"),
  amountLost: decimal("amount_lost", { precision: 12, scale: 2 }),
  suspectNumber: text("suspect_number"),
  bankEntity: text("bank_entity"),
  sharedOtp: boolean("shared_otp").default(false),
  transferMade: boolean("transfer_made").default(false),
  appCompromised: text("app_compromised"),
  deviceAffected: text("device_affected"),
  country: text("country"),
  city: text("city"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat Messages (Internal Chat)
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => cases.id),
  senderId: integer("sender_id").references(() => users.id),
  content: text("content").notNull(),
  fromAdmin: boolean("from_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Evidence table
export const evidences = pgTable("evidences", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => cases.id),
  type: text("type"), // screenshot, document, url, audio, video
  filePath: text("file_path"),
  fileId: text("file_id"), // telegram file id
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bot Interactions Log
export const botInteractions = pgTable("bot_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  telegramId: text("telegram_id"),
  message: text("message"),
  actionType: text("action_type"),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Reported Numbers (Fraud Database)
export const reportedNumbers = pgTable("reported_numbers", {
  id: serial("id").primaryKey(),
  number: text("number").unique(),
  reportCount: integer("report_count").default(1),
  fraudType: text("fraud_type"),
  originCountry: text("origin_country"),
  lastReportedAt: timestamp("last_reported_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  cases: many(cases),
  interactions: many(botInteractions),
  messages: many(messages),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  user: one(users, {
    fields: [cases.userId],
    references: [users.id],
  }),
  evidences: many(evidences),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  case: one(cases, {
    fields: [messages.caseId],
    references: [cases.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCaseSchema = createInsertSchema(cases).omit({ id: true, createdAt: true, updatedAt: true, caseNumber: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Case = typeof cases.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Evidence = typeof evidences.$inferSelect;
export type InsertEvidence = z.infer<typeof insertMessageSchema>; // Temporarily
export type ReportedNumber = typeof reportedNumbers.$inferSelect;
export type InsertReportedNumber = z.infer<typeof insertMessageSchema>; // Temporarily
export type BotInteraction = typeof botInteractions.$inferSelect;
export type InsertBotInteraction = z.infer<typeof insertMessageSchema>; // Temporarily
