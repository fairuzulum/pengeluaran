export type ExpenseCategory = 'cicilan' | 'kebutuhan' | 'utilitas' | 'pribadi' | 'lainnya';

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  isPaidThisMonth?: boolean;
  dueDateDay?: number; // e.g., tanggal jatuh tempo (1-31)
  endMonthYear?: string; // Target bulan selesai/habis, format 'YYYY-MM'. Kosong = berlangsung terus tanpa batas.
  notes?: string;
}

export interface SpecialIncome {
  id: string;
  name: string;
  amount: number;
  monthYear: string; // Format 'YYYY-MM', e.g. '2026-12'
  notes?: string;
}

export interface SimulationExpense {
  id: string;
  name: string;
  amount: number;
  monthYear: string; // Format 'YYYY-MM', e.g. '2026-10'
  isActive: boolean;
  notes?: string;
}

export interface MonthProjection {
  monthIndex: number;
  monthYear: string; // '2026-09'
  monthLabel: string; // 'Sep 2026'
  fullMonthLabel: string; // 'September 2026'
  startingBalance: number;
  regularIncome: number;
  specialIncome: number;
  totalIncome: number;
  regularExpense: number;
  simulatedExpense: number;
  totalExpense: number;
  netCashflow: number;
  endingBalance: number;
  // Baseline without simulation
  baselineEndingBalance: number;
  isDeficit: boolean;
  isNegativeBalance: boolean;
}

export interface FinancialData {
  monthlySalary: number; // default: 5500000
  startingBalance: number; // default: 10300000
  startingMonthYear: string; // default: '2026-09'
  expenses: ExpenseItem[];
  specialIncomes: SpecialIncome[];
  simulations: SimulationExpense[];
  projectionMonthsCount: number; // default: 12
}