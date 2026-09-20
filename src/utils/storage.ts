
import {
  FinancialData,
  ExpenseItem,
  SpecialIncome,
  SimulationExpense,
  MonthProjection,
  IncomePeriod,
} from '../types';

import {
  addMonths,
  formatMonthYearLabel,
  formatMonthYearShort,
} from './formatters';

const API_URL = 'http://localhost:3001/api';

export function isExpenseActiveInMonth(
  item: ExpenseItem,
  monthYear: string
): boolean {
  if (monthYear < item.startMonthYear) return false;

  if (!item.endMonthYear) return true;

  return monthYear <= item.endMonthYear;
}

export function isIncomeActiveInMonth(
  income: IncomePeriod,
  monthYear: string
): boolean {
  if (monthYear < income.startMonth) return false;

  if (!income.endMonth) return true;

  return monthYear <= income.endMonth;
}

/**
 * Mengambil seluruh data financial dari PostgreSQL melalui API.
 *
 * Kalau database masih kosong, hasilnya null.
 * Kita TIDAK membuat default financial data.
 */
export async function loadFinancialData(): Promise<FinancialData | null> {
  try {
    const response = await fetch(`${API_URL}/financial-data`);

    if (!response.ok) {
      throw new Error(
        `Gagal mengambil financial data: HTTP ${response.status}`
      );
    }

    const data = await response.json();

    if (!data) {
      return null;
    }

    return {
      currentBalance: Number(data.currentBalance) || 0,
      startingMonthYear: data.startingMonthYear,
      projectionMonthsCount: Number(data.projectionMonthsCount) || 60,

      incomePeriods: Array.isArray(data.incomePeriods)
        ? data.incomePeriods
        : [],

      expenses: Array.isArray(data.expenses)
        ? data.expenses
        : [],

      specialIncomes: Array.isArray(data.specialIncomes)
        ? data.specialIncomes
        : [],

      simulations: Array.isArray(data.simulations)
        ? data.simulations
        : [],
    };
  } catch (error) {
    console.error('Gagal memuat financial data dari API:', error);
    throw error;
  }
}

/**
 * Menyimpan seluruh financial data ke PostgreSQL melalui API.
 */
export async function saveFinancialData(
  data: FinancialData
): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/financial-data`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);

      throw new Error(
        errorBody?.error ||
          `Gagal menyimpan financial data: HTTP ${response.status}`
      );
    }
  } catch (error) {
    console.error('Gagal menyimpan financial data ke API:', error);
    throw error;
  }
}

/**
 * Reset financial data.
 *
 * Karena database sekarang menjadi sumber data utama,
 * reset dilakukan dengan mengirim data kosong ke API.
 */
export async function resetFinancialData(): Promise<FinancialData> {
  const emptyData: FinancialData = {
    currentBalance: 0,
    startingMonthYear: new Date().toISOString().slice(0, 7),
    projectionMonthsCount: 60,

    incomePeriods: [],
    expenses: [],
    specialIncomes: [],
    simulations: [],
  };

  await saveFinancialData(emptyData);

  return emptyData;
}

/**
 * Menghitung income reguler pada bulan tertentu
 * berdasarkan income period yang aktif.
 */
function calculateRegularIncome(
  incomePeriods: IncomePeriod[],
  monthYear: string
): number {
  return incomePeriods
    .filter((income) => isIncomeActiveInMonth(income, monthYear))
    .reduce(
      (sum, income) => sum + (Number(income.amount) || 0),
      0
    );
}

/**
 * Calculates month-by-month financial projection.
 */
export function calculateProjections(
  data: FinancialData
): MonthProjection[] {
  const {
    currentBalance,
    startingMonthYear,
    expenses,
    incomePeriods,
    specialIncomes,
    simulations,
    projectionMonthsCount = 60,
  } = data;

  const projections: MonthProjection[] = [];

  let currentBalanceValue = currentBalance;
  let currentBaselineBalance = currentBalance;

  for (let i = 0; i < projectionMonthsCount; i++) {
    const monthYear = addMonths(startingMonthYear, i);

    const monthLabel = formatMonthYearShort(monthYear);
    const fullMonthLabel = formatMonthYearLabel(monthYear);

    // =========================================================
    // INCOME PERIODS
    // =========================================================

    const regularIncome = calculateRegularIncome(
      incomePeriods,
      monthYear
    );

    // =========================================================
    // FIXED EXPENSES
    // =========================================================

    const activeExpensesThisMonth = expenses.filter((item) =>
      isExpenseActiveInMonth(item, monthYear)
    );

    const totalFixedExpenseThisMonth =
      activeExpensesThisMonth.reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0
      );

    // =========================================================
    // SPECIAL INCOME
    // =========================================================

    const monthSpecialIncomes = specialIncomes.filter(
      (income) => income.monthYear === monthYear
    );

    const specialIncomeAmount = monthSpecialIncomes.reduce(
      (sum, income) => sum + (Number(income.amount) || 0),
      0
    );

    // =========================================================
    // SIMULATED EXPENSE
    // =========================================================

    const monthSimulations = simulations.filter(
      (simulation) =>
        simulation.isActive &&
        simulation.monthYear === monthYear
    );

    const simulatedExpenseAmount = monthSimulations.reduce(
      (sum, simulation) =>
        sum + (Number(simulation.amount) || 0),
      0
    );

    // =========================================================
    // TOTAL
    // =========================================================

    const totalIncome =
      regularIncome + specialIncomeAmount;

    const totalExpense =
      totalFixedExpenseThisMonth + simulatedExpenseAmount;

    const netCashflow =
      totalIncome - totalExpense;

    // =========================================================
    // NORMAL BALANCE
    // =========================================================

    const startBal = currentBalanceValue;

    const endBal =
      startBal + netCashflow;

    currentBalanceValue = endBal;

    // =========================================================
    // BASELINE
    // Tanpa simulation expense
    // =========================================================

    const baselineTotalExpense =
      totalFixedExpenseThisMonth;

    const baselineNetCashflow =
      totalIncome - baselineTotalExpense;

    const baselineEndBal =
      currentBaselineBalance +
      baselineNetCashflow;

    currentBaselineBalance =
      baselineEndBal;

    // =========================================================
    // RESULT
    // =========================================================

    projections.push({
      monthIndex: i,

      monthYear,
      monthLabel,
      fullMonthLabel,

      startingBalance: startBal,

      regularIncome,
      specialIncome: specialIncomeAmount,
      totalIncome,

      regularExpense: totalFixedExpenseThisMonth,
      simulatedExpense: simulatedExpenseAmount,
      totalExpense,

      netCashflow,
      endingBalance: endBal,

      baselineEndingBalance:
        baselineEndBal,

      isDeficit: netCashflow < 0,

      isNegativeBalance:
        endBal < 0,
    });
  }

  return projections;
}

/**
 * Calculates runway.
 */
export function calculateRunwayMonths(
  projections: MonthProjection[]
): {
  firstNegativeMonthIndex: number | null;
  firstNegativeMonthLabel: string | null;
  monthsRemaining: number | null;
} {
  const firstNegative = projections.find(
    (projection) =>
      projection.endingBalance < 0
  );

  if (!firstNegative) {
    return {
      firstNegativeMonthIndex: null,
      firstNegativeMonthLabel: null,
      monthsRemaining: null,
    };
  }

  return {
    firstNegativeMonthIndex:
      firstNegative.monthIndex,

    firstNegativeMonthLabel:
      firstNegative.fullMonthLabel,

    monthsRemaining:
      firstNegative.monthIndex,
  };
}
