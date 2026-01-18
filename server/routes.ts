import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertCaseSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- API Routes ---

  // Stats
  app.get(api.stats.dashboard.path, async (_req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  app.get(api.stats.byType.path, async (_req, res) => {
    const stats = await storage.getStatsByType();
    // Add colors for charts
    const coloredStats = stats.map((s, i) => ({
      ...s,
      fill: `hsl(var(--chart-${(i % 5) + 1}))`,
    }));
    res.json(coloredStats);
  });

  app.get(api.stats.history.path, async (_req, res) => {
    const history = await storage.getStatsHistory();
    res.json(history);
  });

  // Cases
  app.get(api.cases.list.path, async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const status = req.query.status as string | undefined;
    const cases = await storage.getCases(limit, offset, status);
    res.json(cases);
  });

  app.get(api.cases.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const caseItem = await storage.getCase(id);
    if (!caseItem) {
      return res.status(404).json({ message: "Case not found" });
    }
    res.json(caseItem);
  });

  app.post(api.cases.create.path, async (req, res) => {
    try {
      const data = insertCaseSchema.parse(req.body);
      const newCase = await storage.createCase(data);
      res.status(201).json(newCase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch(api.cases.updateStatus.path, async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    const updatedCase = await storage.updateCaseStatus(id, status);
    if (!updatedCase) {
      return res.status(404).json({ message: "Case not found" });
    }
    res.json(updatedCase);
  });

  // Users
  app.get(api.users.active.path, async (_req, res) => {
    const users = await storage.getActiveUsers();
    res.json(users);
  });

  // Reported Numbers
  app.get(api.reportedNumbers.top.path, async (_req, res) => {
    const numbers = await storage.getTopReportedNumbers();
    res.json(numbers);
  });

  // Seed Data function
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const stats = await storage.getDashboardStats();
  if (stats.totalCases > 0) return; // Already seeded

  console.log("Seeding database...");

  // Create Users
  const user1 = await storage.createUser({
    fullName: "Maria Garcia",
    identificationNumber: "1234567890",
    age: 34,
    profession: "Accountant",
    residenceCity: "Bogota",
    residenceCountry: "Colombia",
    phoneNumber: "+573001234567",
    telegramId: "123456"
  });

  const user2 = await storage.createUser({
    fullName: "Juan Perez",
    identificationNumber: "0987654321",
    age: 28,
    profession: "Engineer",
    residenceCity: "Medellin",
    residenceCountry: "Colombia",
    phoneNumber: "+573109876543",
    telegramId: "654321"
  });

  // Create Cases
  await storage.createCase({
    userId: user1.id,
    type: "phishing",
    status: "nuevo",
    description: "Recibí un correo del banco solicitando mis claves.",
    amountLost: "0",
    incidentDate: new Date(),
    country: "Colombia",
    city: "Bogota"
  });

  await storage.createCase({
    userId: user2.id,
    type: "extorsion",
    status: "en_proceso",
    description: "Amenazas por WhatsApp exigiendo dinero.",
    amountLost: "500000",
    incidentDate: new Date(),
    suspectNumber: "+573000000000",
    country: "Colombia",
    city: "Medellin"
  });

  await storage.createCase({
    userId: user1.id,
    type: "hackeo_whatsapp",
    status: "resuelto",
    description: "Me robaron la cuenta de WhatsApp y pidieron dinero a contactos.",
    amountLost: "200000",
    incidentDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
    country: "Colombia",
    city: "Bogota"
  });
  
  // Reported Numbers
  await storage.createReportedNumber({
    number: "+573000000000",
    reportCount: 5,
    fraudType: "Extorsión",
    originCountry: "Colombia"
  });

  await storage.createReportedNumber({
    number: "+573111111111",
    reportCount: 3,
    fraudType: "Phishing bancario",
    originCountry: "Colombia"
  });

  console.log("Seeding complete.");
}
