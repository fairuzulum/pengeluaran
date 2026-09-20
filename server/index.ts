import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./prisma";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

/**
 * HEALTH CHECK
 */
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      database: "connected",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      database: "error",
    });
  }
});

/**
 * GET FINANCIAL DATA
 */
app.get("/api/financial-data", async (_req, res) => {
  try {
    const settings = await prisma.financialSettings.findFirst({
      include: {
        incomePeriods: true,
        expenses: true,
        specialIncomes: true,
        simulations: true,
      },
    });

    if (!settings) {
      return res.json(null);
    }

    res.json({
      currentBalance: Number(settings.currentBalance),
      startingMonthYear: settings.startingMonthYear,
      projectionMonthsCount: settings.projectionMonthsCount,

      incomePeriods: settings.incomePeriods.map((income) => ({
        id: income.id,
        name: income.name,
        amount: Number(income.amount),
        startMonth: income.startMonth,
        endMonth: income.endMonth ?? undefined,
        notes: income.notes ?? undefined,
      })),

      expenses: settings.expenses.map((expense) => ({
        id: expense.id,
        name: expense.name,
        amount: Number(expense.amount),
        category: expense.category,
        startMonthYear: expense.startMonthYear,
        endMonthYear: expense.endMonthYear ?? undefined,
        isPaidThisMonth: expense.isPaidThisMonth,
        dueDateDay: expense.dueDateDay ?? undefined,
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
    console.error("GET financial data error:", error);

    res.status(500).json({
      error: "Gagal mengambil data financial",
    });
  }
});

/**
 * PUT FINANCIAL DATA
 *
 * Untuk sekarang endpoint ini menerima seluruh object financial
 * dan menyimpannya sebagai satu transaction.
 */
app.put("/api/financial-data", async (req, res) => {
  try {
    const data = req.body;

    if (!data) {
      return res.status(400).json({
        error: "Data tidak ditemukan",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      let settings = await tx.financialSettings.findFirst();

      if (!settings) {
        settings = await tx.financialSettings.create({
          data: {
            currentBalance: data.currentBalance ?? 0,
            startingMonthYear:
              data.startingMonthYear ??
              new Date().toISOString().slice(0, 7),
            projectionMonthsCount:
              data.projectionMonthsCount ?? 60,
          },
        });
      } else {
        settings = await tx.financialSettings.update({
          where: {
            id: settings.id,
          },
          data: {
            currentBalance: data.currentBalance ?? 0,
            startingMonthYear:
              data.startingMonthYear ??
              settings.startingMonthYear,
            projectionMonthsCount:
              data.projectionMonthsCount ?? 60,
          },
        });
      }

      await tx.incomePeriod.deleteMany({
        where: {
          settingsId: settings.id,
        },
      });

      await tx.expenseItem.deleteMany({
        where: {
          settingsId: settings.id,
        },
      });

      await tx.specialIncome.deleteMany({
        where: {
          settingsId: settings.id,
        },
      });

      await tx.simulationExpense.deleteMany({
        where: {
          settingsId: settings.id,
        },
      });

      if (Array.isArray(data.incomePeriods)) {
        await tx.incomePeriod.createMany({
          data: data.incomePeriods.map((income: any) => ({
            id: income.id,
            name: income.name,
            amount: income.amount,
            startMonth: income.startMonth,
            endMonth: income.endMonth ?? null,
            notes: income.notes ?? null,
            settingsId: settings.id,
          })),
        });
      }

      if (Array.isArray(data.expenses)) {
        await tx.expenseItem.createMany({
          data: data.expenses.map((expense: any) => ({
            id: expense.id,
            name: expense.name,
            amount: expense.amount,
            category: expense.category,
            startMonthYear: expense.startMonthYear,
            endMonthYear: expense.endMonthYear ?? null,
            isPaidThisMonth: expense.isPaidThisMonth ?? false,
            dueDateDay: expense.dueDateDay ?? null,
            notes: expense.notes ?? null,
            settingsId: settings.id,
          })),
        });
      }

      if (Array.isArray(data.specialIncomes)) {
        await tx.specialIncome.createMany({
          data: data.specialIncomes.map((income: any) => ({
            id: income.id,
            name: income.name,
            amount: income.amount,
            monthYear: income.monthYear,
            notes: income.notes ?? null,
            settingsId: settings.id,
          })),
        });
      }

      if (Array.isArray(data.simulations)) {
        await tx.simulationExpense.createMany({
          data: data.simulations.map((simulation: any) => ({
            id: simulation.id,
            name: simulation.name,
            amount: simulation.amount,
            monthYear: simulation.monthYear,
            isActive: simulation.isActive ?? false,
            notes: simulation.notes ?? null,
            settingsId: settings.id,
          })),
        });
      }

      return settings;
    });

    res.json({
      success: true,
      id: result.id,
    });
  } catch (error) {
    console.error("PUT financial data error:", error);

    res.status(500).json({
      error: "Gagal menyimpan financial data",
    });
  }
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});