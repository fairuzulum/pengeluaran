export type ExpenseCategory =
  | 'cicilan'
  | 'kebutuhan'
  | 'utilitas'
  | 'pribadi'
  | 'lainnya';

export interface IncomePeriod {
  id: string;
  name: string;
  amount: number;
  startMonth: string; // Format: YYYY-MM
  endMonth?: string; // Format: YYYY-MM. Kosong = berlangsung terus.
  notes?: string;
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  startMonthYear: string; // Format: YYYY-MM
  endMonthYear?: string; // Format: YYYY-MM. Kosong = berlangsung terus.
  isPaidThisMonth?: boolean;
  dueDateDay?: number; // 1-31
  notes?: string;
}

export interface SpecialIncome {
  id: string;
  name: string;
  amount: number;
  monthYear: string; // Format: YYYY-MM
  notes?: string;
}

export interface SimulationExpense {
  id: string;
  name: string;
  amount: number;
  monthYear: string; // Format: YYYY-MM
  isActive: boolean;
  notes?: string;
}

export interface MonthProjection {
  monthIndex: number;
  monthYear: string;
  monthLabel: string;
  fullMonthLabel: string;

  startingBalance: number;

  regularIncome: number;
  specialIncome: number;
  totalIncome: number;

  regularExpense: number;
  simulatedExpense: number;
  totalExpense: number;

  netCashflow: number;
  endingBalance: number;

  baselineEndingBalance: number;

  isDeficit: boolean;
  isNegativeBalance: boolean;
}

export interface FinancialData {
  currentBalance: number;
  startingMonthYear: string;
  projectionMonthsCount: number;

  incomePeriods: IncomePeriod[];
  expenses: ExpenseItem[];
  specialIncomes: SpecialIncome[];
  simulations: SimulationExpense[];
}
