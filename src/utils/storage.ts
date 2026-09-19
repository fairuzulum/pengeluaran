import { FinancialData, ExpenseItem, SpecialIncome, SimulationExpense, MonthProjection } from '../types';
import { addMonths, formatMonthYearLabel, formatMonthYearShort } from './formatters';

export const DEFAULT_FINANCIAL_DATA: FinancialData = {
  monthlySalary: 5500000,
  startingBalance: 10300000,
  startingMonthYear: '2026-09',
  expenses: [
    {
      id: 'exp-1',
      name: 'Cicilan Maybank',
      amount: 1600000,
      category: 'cicilan',
      isPaidThisMonth: false,
      dueDateDay: 10,
      notes: 'Cicilan bulanan Maybank'
    },
    {
      id: 'exp-2',
      name: 'Cicilan SeaBank',
      amount: 1460000,
      category: 'cicilan',
      isPaidThisMonth: false,
      dueDateDay: 15,
      notes: 'Cicilan pinjaman SeaBank'
    },
    {
      id: 'exp-3',
      name: 'Cicilan Kredivo',
      amount: 1700000,
      category: 'cicilan',
      isPaidThisMonth: false,
      dueDateDay: 20,
      notes: 'Cicilan paylater Kredivo'
    },
    {
      id: 'exp-4',
      name: 'Cicilan Motor',
      amount: 1000000,
      category: 'cicilan',
      isPaidThisMonth: false,
      dueDateDay: 5,
      notes: 'Leasing motor bulanan'
    },
    {
      id: 'exp-5',
      name: 'Transportasi',
      amount: 500000,
      category: 'kebutuhan',
      isPaidThisMonth: false,
      notes: 'Bensin & operasional harian'
    },
    {
      id: 'exp-6',
      name: 'Listrik',
      amount: 200000,
      category: 'utilitas',
      isPaidThisMonth: false,
      dueDateDay: 20,
      notes: 'Token / tagihan listrik PLN'
    },
    {
      id: 'exp-7',
      name: 'Wifi',
      amount: 200000,
      category: 'utilitas',
      isPaidThisMonth: false,
      dueDateDay: 15,
      notes: 'Internet rumah bulanan'
    },
    {
      id: 'exp-8',
      name: 'Jajan / kebutuhan pribadi',
      amount: 500000,
      category: 'pribadi',
      isPaidThisMonth: false,
      notes: 'Makan di luar, kopi, dan kebutuhan harian'
    }
  ],
  specialIncomes: [
    {
      id: 'inc-1',
      name: 'Kompensasi Kontrak Kerja',
      amount: 5500000,
      monthYear: '2026-12',
      notes: 'Cair khusus bulan Desember (tambahan, sekali setahun)'
    }
  ],
  simulations: [
    {
      id: 'sim-1',
      name: 'Servis Motor & Ganti Ban',
      amount: 450000,
      monthYear: '2026-10',
      isActive: false,
      notes: 'Simulasi pengeluaran bengkel berkala'
    },
    {
      id: 'sim-2',
      name: 'Kondangan & Hadiah Nikah',
      amount: 300000,
      monthYear: '2026-11',
      isActive: false,
      notes: 'Amplop kondangan teman'
    }
  ],
  projectionMonthsCount: 12
};

const STORAGE_KEY = 'pengeluaran_gua_v1';

/**
 * Checks whether an expense item is still active (belum selesai/habis) on a given month.
 * If endMonthYear is not set, the expense is treated as recurring indefinitely.
 * If set, the expense is still counted on its end month itself, and stops the month after.
 */
export function isExpenseActiveInMonth(item: ExpenseItem, monthYear: string): boolean {
  if (!item.endMonthYear) return true;
  return monthYear <= item.endMonthYear;
}

export function loadFinancialData(): FinancialData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FINANCIAL_DATA;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_FINANCIAL_DATA,
      ...parsed,
      expenses: parsed.expenses && parsed.expenses.length > 0 ? parsed.expenses : DEFAULT_FINANCIAL_DATA.expenses,
      specialIncomes: parsed.specialIncomes || DEFAULT_FINANCIAL_DATA.specialIncomes,
      simulations: parsed.simulations || DEFAULT_FINANCIAL_DATA.simulations
    };
  } catch (e) {
    console.warn('Gagal memuat data dari localStorage, menggunakan default', e);
    return DEFAULT_FINANCIAL_DATA;
  }
}

export function saveFinancialData(data: FinancialData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Gagal menyimpan data ke localStorage', e);
  }
}

export function resetFinancialData(): FinancialData {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Gagal menghapus cache', e);
  }
  return DEFAULT_FINANCIAL_DATA;
}

/**
 * Calculates month-by-month financial projection.
 */
export function calculateProjections(data: FinancialData): MonthProjection[] {
  const {
    monthlySalary,
    startingBalance,
    startingMonthYear,
    expenses,
    specialIncomes,
    simulations,
    projectionMonthsCount = 12
  } = data;

  const projections: MonthProjection[] = [];

  let currentBalance = startingBalance;
  let currentBaselineBalance = startingBalance;

  for (let i = 0; i < projectionMonthsCount; i++) {
    const monthYear = addMonths(startingMonthYear, i);
    const monthLabel = formatMonthYearShort(monthYear);
    const fullMonthLabel = formatMonthYearLabel(monthYear);

    // Fixed expenses that are still active this month (belum lewat target bulan selesai)
    const activeExpensesThisMonth = expenses.filter(item => isExpenseActiveInMonth(item, monthYear));
    const totalFixedExpenseThisMonth = activeExpensesThisMonth.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );

    // Special Incomes for this month
    const monthSpecialIncomes = specialIncomes.filter(inc => inc.monthYear === monthYear);
    const specialIncomeAmount = monthSpecialIncomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

    // Simulated Expenses for this month (only active ones)
    const monthSimulations = simulations.filter(sim => sim.isActive && sim.monthYear === monthYear);
    const simulatedExpenseAmount = monthSimulations.reduce((sum, sim) => sum + (Number(sim.amount) || 0), 0);

    const totalIncome = monthlySalary + specialIncomeAmount;
    const totalExpense = totalFixedExpenseThisMonth + simulatedExpenseAmount;
    const netCashflow = totalIncome - totalExpense;

    const startBal = currentBalance;
    const endBal = startBal + netCashflow;
    currentBalance = endBal;

    // Baseline calculation (without active simulations)
    const baselineTotalExpense = totalFixedExpenseThisMonth;
    const baselineNetCashflow = totalIncome - baselineTotalExpense;
    const baselineEndBal = currentBaselineBalance + baselineNetCashflow;
    currentBaselineBalance = baselineEndBal;

    projections.push({
      monthIndex: i,
      monthYear,
      monthLabel,
      fullMonthLabel,
      startingBalance: startBal,
      regularIncome: monthlySalary,
      specialIncome: specialIncomeAmount,
      totalIncome,
      regularExpense: totalFixedExpenseThisMonth,
      simulatedExpense: simulatedExpenseAmount,
      totalExpense,
      netCashflow,
      endingBalance: endBal,
      baselineEndingBalance: baselineEndBal,
      isDeficit: netCashflow < 0,
      isNegativeBalance: endBal < 0
    });
  }

  return projections;
}

/**
 * Calculates runway (how many months savings will last under current deficit).
 */
export function calculateRunwayMonths(projections: MonthProjection[]): {
  firstNegativeMonthIndex: number | null;
  firstNegativeMonthLabel: string | null;
  monthsRemaining: number | null;
} {
  const firstNegative = projections.find(p => p.endingBalance < 0);
  if (!firstNegative) {
    return {
      firstNegativeMonthIndex: null,
      firstNegativeMonthLabel: null,
      monthsRemaining: null
    };
  }

  return {
    firstNegativeMonthIndex: firstNegative.monthIndex,
    firstNegativeMonthLabel: firstNegative.fullMonthLabel,
    monthsRemaining: firstNegative.monthIndex
  };
}