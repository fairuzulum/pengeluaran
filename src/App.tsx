import React, { useState, useEffect, useMemo } from 'react';

import { User } from 'firebase/auth';

import { Header } from './components/Header';
import { DashboardSummary } from './components/DashboardSummary';
import { ExpenseList } from './components/ExpenseList';
import { ProjectionChart } from './components/ProjectionChart';
import { SavingsTracker } from './components/SavingsTracker';
import { WhatIfSimulation } from './components/WhatIfSimulation';
import { SpecialIncomeManager } from './components/SpecialIncomeManager';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';

import {
  FinancialData,
  ExpenseItem,
  SpecialIncome,
  SimulationExpense,
} from './types';

import {
  loadFinancialData,
  saveFinancialData,
  resetFinancialData,
  calculateProjections,
  calculateRunwayMonths,
  isExpenseActiveInMonth,
} from './utils/storage';

import { initGoogleAuth } from './services/googleSheets';

import {
  addMonths,
  formatMonthYearLabel,
} from './utils/formatters';

export default function App() {
  const [data, setData] = useState<FinancialData | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isSheetsModalOpen, setIsSheetsModalOpen] =
    useState(false);

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [cachedToken, setCachedToken] =
    useState<string | null>(null);

  // =========================================================
  // LOAD DATA DARI POSTGRESQL
  // =========================================================

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const loaded = await loadFinancialData();

        if (mounted) {
          setData(loaded);
        }
      } catch (error) {
        console.error(
          'Gagal memuat data financial:',
          error
        );

        if (mounted) {
          setData(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // GOOGLE AUTH
  // =========================================================

  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setCurrentUser(user);
        setCachedToken(token);
      },
      () => {
        setCurrentUser(null);
        setCachedToken(null);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // =========================================================
  // AUTO SAVE KE POSTGRESQL
  // =========================================================

  useEffect(() => {
    if (isLoading || !data) {
      return;
    }

    const timeout = window.setTimeout(() => {
      saveFinancialData(data).catch((error) => {
        console.error(
          'Gagal auto-save financial data:',
          error
        );
      });
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [data, isLoading]);

  // =========================================================
  // DERIVED DATA
  //
  // PENTING:
  // Semua Hook HARUS berada sebelum conditional return.
  // =========================================================

  const projections = useMemo(() => {
    if (!data) {
      return [];
    }

    return calculateProjections(data);
  }, [data]);

  const activeExpensesThisMonth = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.expenses.filter((expense) =>
      isExpenseActiveInMonth(
        expense,
        data.startingMonthYear
      )
    );
  }, [data]);

  const projectionMonthOptions = useMemo(() => {
    if (!data) {
      return [];
    }

    const options: {
      value: string;
      label: string;
    }[] = [];

    for (let i = 0; i < 24; i++) {
      const monthYear = addMonths(
        data.startingMonthYear,
        i
      );

      options.push({
        value: monthYear,
        label: formatMonthYearLabel(monthYear),
      });
    }

    return options;
  }, [data]);

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-slate-700">
            Memuat data...
          </div>

          <div className="text-sm text-slate-500 mt-2">
            Menghubungkan ke PostgreSQL
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // DATABASE KOSONG
  // =========================================================

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
          <h1 className="text-xl font-bold text-slate-800">
            Data Financial Belum Ada
          </h1>

          <p className="text-sm text-slate-500 mt-3">
            PostgreSQL sudah terhubung, tetapi belum ada
            data financial.
          </p>

          <p className="text-sm text-slate-500 mt-2">
            Silakan buat data awal dari aplikasi.
          </p>

          <button
            type="button"
            onClick={async () => {
              const emptyData: FinancialData = {
                currentBalance: 0,

                startingMonthYear:
                  new Date()
                    .toISOString()
                    .slice(0, 7),

                projectionMonthsCount: 60,

                incomePeriods: [],

                expenses: [],

                specialIncomes: [],

                simulations: [],
              };

              try {
                await saveFinancialData(emptyData);

                setData(emptyData);
              } catch (error) {
                console.error(error);

                alert(
                  'Gagal membuat data awal.'
                );
              }
            }}
            className="mt-6 w-full px-4 py-3 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition"
          >
            Buat Data Awal
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // ACTIVE EXPENSE
  // =========================================================

  const activeFixedExpenseThisMonth =
    activeExpensesThisMonth.reduce(
      (sum, expense) =>
        sum + (Number(expense.amount) || 0),
      0
    );

  // =========================================================
  // CURRENT MONTH PROJECTION
  // =========================================================

  const currentMonthProjection =
    projections[0] || {
      monthIndex: 0,

      monthYear:
        data.startingMonthYear,

      monthLabel:
        formatMonthYearLabel(
          data.startingMonthYear
        ),

      fullMonthLabel:
        formatMonthYearLabel(
          data.startingMonthYear
        ),

      startingBalance:
        data.currentBalance,

      regularIncome: 0,

      specialIncome: 0,

      totalIncome: 0,

      regularExpense:
        activeFixedExpenseThisMonth,

      simulatedExpense: 0,

      totalExpense:
        activeFixedExpenseThisMonth,

      netCashflow:
        -activeFixedExpenseThisMonth,

      endingBalance:
        data.currentBalance -
        activeFixedExpenseThisMonth,

      baselineEndingBalance:
        data.currentBalance -
        activeFixedExpenseThisMonth,

      isDeficit: true,

      isNegativeBalance:
        data.currentBalance -
          activeFixedExpenseThisMonth <
        0,
    };

  // =========================================================
  // RUNWAY
  // =========================================================

  const runway =
    calculateRunwayMonths(projections);

  // =========================================================
  // INCOME RUTIN BULAN INI
  // =========================================================

  const currentMonthRegularIncome =
    data.incomePeriods
      .filter((income) => {
        if (
          data.startingMonthYear <
          income.startMonth
        ) {
          return false;
        }

        if (!income.endMonth) {
          return true;
        }

        return (
          data.startingMonthYear <=
          income.endMonth
        );
      })
      .reduce(
        (sum, income) =>
          sum +
          (Number(income.amount) || 0),
        0
      );

  // =========================================================
  // HANDLERS
  // =========================================================

  const handleUpdateStartingBalance = (
    newBalance: number
  ) => {
    setData((previous) => ({
      ...previous,
      currentBalance: newBalance,
    }));
  };

  // =========================================================
  // ADD EXPENSE
  // =========================================================

  const handleAddExpense = (
    item: Omit<ExpenseItem, 'id'>
  ) => {
    const newItem: ExpenseItem = {
      ...item,
      id: `exp-${Date.now()}`,
    };

    setData((previous) => ({
      ...previous,
      expenses: [
        ...previous.expenses,
        newItem,
      ],
    }));
  };

  // =========================================================
  // UPDATE EXPENSE
  // =========================================================

  const handleUpdateExpense = (
    id: string,
    updated: Partial<ExpenseItem>
  ) => {
    setData((previous) => ({
      ...previous,

      expenses:
        previous.expenses.map(
          (expense) =>
            expense.id === id
              ? {
                  ...expense,
                  ...updated,
                }
              : expense
        ),
    }));
  };

  // =========================================================
  // DELETE EXPENSE
  // =========================================================

  const handleDeleteExpense = (
    id: string
  ) => {
    setData((previous) => ({
      ...previous,

      expenses:
        previous.expenses.filter(
          (expense) =>
            expense.id !== id
        ),
    }));
  };

  // =========================================================
  // ADD SPECIAL INCOME
  // =========================================================

  const handleAddSpecialIncome = (
    income: Omit<SpecialIncome, 'id'>
  ) => {
    const newIncome: SpecialIncome = {
      ...income,
      id: `inc-${Date.now()}`,
    };

    setData((previous) => ({
      ...previous,

      specialIncomes: [
        ...previous.specialIncomes,
        newIncome,
      ],
    }));
  };

  // =========================================================
  // DELETE SPECIAL INCOME
  // =========================================================

  const handleDeleteSpecialIncome = (
    id: string
  ) => {
    setData((previous) => ({
      ...previous,

      specialIncomes:
        previous.specialIncomes.filter(
          (income) =>
            income.id !== id
        ),
    }));
  };

  // =========================================================
  // ADD SIMULATION
  // =========================================================

  const handleAddSimulation = (
    simulation: Omit<
      SimulationExpense,
      'id'
    >
  ) => {
    const newSimulation:
      SimulationExpense = {
      ...simulation,
      id: `sim-${Date.now()}`,
    };

    setData((previous) => ({
      ...previous,

      simulations: [
        ...previous.simulations,
        newSimulation,
      ],
    }));
  };

  // =========================================================
  // TOGGLE SIMULATION
  // =========================================================

  const handleToggleSimulation = (
    id: string
  ) => {
    setData((previous) => ({
      ...previous,

      simulations:
        previous.simulations.map(
          (simulation) =>
            simulation.id === id
              ? {
                  ...simulation,

                  isActive:
                    !simulation.isActive,
                }
              : simulation
        ),
    }));
  };

  // =========================================================
  // DELETE SIMULATION
  // =========================================================

  const handleDeleteSimulation = (
    id: string
  ) => {
    setData((previous) => ({
      ...previous,

      simulations:
        previous.simulations.filter(
          (simulation) =>
            simulation.id !== id
        ),
    }));
  };

  // =========================================================
  // CHANGE PROJECTION MONTH COUNT
  // =========================================================

  const handleMonthsCountChange = (
    count: number
  ) => {
    setData((previous) => ({
      ...previous,
      projectionMonthsCount: count,
    }));
  };

  // =========================================================
  // RESET DATA
  // =========================================================

  const handleResetData = async () => {
    try {
      const fresh =
        await resetFinancialData();

      setData(fresh);
    } catch (error) {
      console.error(
        'Gagal reset data:',
        error
      );

      alert(
        'Gagal mereset data.'
      );
    }
  };

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalFixedExpense =
    activeFixedExpenseThisMonth;

  const hasActiveSimulations =
    data.simulations.some(
      (simulation) =>
        simulation.isActive
    );

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 font-sans antialiased pb-16">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <Header
        startingBalance={
          data.currentBalance
        }

        totalExpense={
          totalFixedExpense
        }

        monthlySalary={
          currentMonthRegularIncome
        }

        onResetData={
          handleResetData
        }

        onOpenGoogleSheetsModal={() =>
          setIsSheetsModalOpen(true)
        }

        hasActiveGoogleAuth={Boolean(
          currentUser &&
            cachedToken
        )}

        userEmail={
          currentUser?.email
        }
      />

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ===================================================
            DASHBOARD SUMMARY
        =================================================== */}

        <DashboardSummary
          monthlySalary={
            currentMonthRegularIncome
          }

          startingBalance={
            data.currentBalance
          }

          currentMonthProjection={
            currentMonthProjection
          }

          firstNegativeMonthLabel={
            runway.firstNegativeMonthLabel
          }

          monthsRemaining={
            runway.monthsRemaining
          }

          onUpdateSalary={() => {
            console.log(
              'Gunakan Income Periods untuk mengubah pemasukan rutin.'
            );
          }}

          onUpdateStartingBalance={
            handleUpdateStartingBalance
          }
        />

        {/* ===================================================
            PROJECTION CHART
        =================================================== */}

        <ProjectionChart
          projections={
            projections
          }

          hasActiveSimulations={
            hasActiveSimulations
          }

          monthsCount={
            data.projectionMonthsCount
          }

          onMonthsCountChange={
            handleMonthsCountChange
          }
        />

        {/* ===================================================
            EXPENSE + SIDEBAR
        =================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* =================================================
              EXPENSE LIST
          ================================================= */}

          <div className="lg:col-span-7 space-y-6">

            <ExpenseList
              expenses={
                data.expenses
              }

              currentMonthYear={
                data.startingMonthYear
              }

              monthOptions={
                projectionMonthOptions
              }

              onAddExpense={
                handleAddExpense
              }

              onUpdateExpense={
                handleUpdateExpense
              }

              onDeleteExpense={
                handleDeleteExpense
              }
            />

          </div>

          {/* =================================================
              RIGHT SIDEBAR
          ================================================= */}

          <div className="lg:col-span-5 space-y-6">

            {/* ===============================================
                WHAT IF SIMULATION
            =============================================== */}

            <WhatIfSimulation
              simulations={
                data.simulations
              }

              projections={
                projections
              }

              projectionMonthOptions={
                projectionMonthOptions
              }

              onAddSimulation={
                handleAddSimulation
              }

              onToggleSimulation={
                handleToggleSimulation
              }

              onDeleteSimulation={
                handleDeleteSimulation
              }
            />

            {/* ===============================================
                SPECIAL INCOME
            =============================================== */}

            <SpecialIncomeManager
              specialIncomes={
                data.specialIncomes
              }

              projectionMonthOptions={
                projectionMonthOptions
              }

              onAddSpecialIncome={
                handleAddSpecialIncome
              }

              onDeleteSpecialIncome={
                handleDeleteSpecialIncome
              }
            />

          </div>

        </div>

        {/* ===================================================
            SAVINGS TRACKER
        =================================================== */}

        <SavingsTracker
          projections={
            projections
          }

          startingBalance={
            data.currentBalance
          }

          onUpdateStartingBalance={
            handleUpdateStartingBalance
          }

          firstNegativeMonthLabel={
            runway.firstNegativeMonthLabel
          }

          monthsRemaining={
            runway.monthsRemaining
          }
        />

      </main>

      {/* =====================================================
          GOOGLE SHEETS MODAL
      ===================================================== */}

      <GoogleSheetsModal
        isOpen={
          isSheetsModalOpen
        }

        onClose={() =>
          setIsSheetsModalOpen(false)
        }

        currentUser={
          currentUser
        }

        cachedToken={
          cachedToken
        }

        onAuthSuccess={(
          user,
          token
        ) => {
          setCurrentUser(user);
          setCachedToken(token);
        }}

        onAuthLogout={() => {
          setCurrentUser(null);
          setCachedToken(null);
        }}

        financialData={
          data
        }

        projections={
          projections
        }
      />

    </div>
  );
}