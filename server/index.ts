import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./prisma";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      database: "connected",
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      success: false,
      database: "error",
    });
  }
});

app.get("/api/financial-data", async (_req, res) => {
  try {
    const settings = await prisma.financialSettings.findFirst({
      include: {
        expenses: true,
        specialIncomes: true,
        simulations: true,
      },
    });

    if (!settings) {
      return res.json(null);
    }

    res.json({
      monthlySalary: Number(settings.monthlySalary),
      startingBalance: Number(settings.startingBalance),
      startingMonthYear: settings.startingMonthYear,
      projectionMonthsCount: settings.projectionMonthsCount,

      expenses: settings.expenses.map((expense) => ({
        id: expense.id,
        name: expense.name,
        amount: Number(expense.amount),
        category: expense.category,
        isPaidThisMonth: expense.isPaidThisMonth,
        dueDateDay: expense.dueDateDay ?? undefined,
        endMonthYear: expense.endMonthYear ?? undefined,
        notes: expense.notes ?? undefined,
      })),

      specialIncomes: settings.specialIncomes.map((income) => ({
        id: income.id,
        name: income.name,
        amount: Number(income.amount),
        monthYear: income.monthYear,
        notes: income.notes ?? undefined,
      })),

      simulations: settings.simulations.map((simulation) => ({
        id: simulation.id,
        name: simulation.name,
        amount: Number(simulation.amount),
        monthYear: simulation.monthYear,
        isActive: simulation.isActive,
        notes: simulation.notes ?? undefined,
      })),
    });
  } catch (error) {
    console.error("Financial data error:", error);

    res.status(500).json({
      error: "Gagal mengambil data",
    });
  }
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
