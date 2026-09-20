import React, { useEffect, useMemo, useState } from 'react';

import { User } from 'firebase/auth';

import { Header } from './components/Header';
import { DashboardSummary } from './components/DashboardSummary';
import { ExpenseList } from './components/ExpenseList';
import { ProjectionChart } from './components/ProjectionChart';
import { SavingsTracker } from './components/SavingsTracker';
import { WhatIfSimulation } from './components/WhatIfSimulation';
import { SpecialIncomeManager } from './components/SpecialIncomeManager';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { IncomePeriodManager } from './components/IncomePeriodManager';

import {
  FinancialData,
  ExpenseItem,
  SpecialIncome,
  SimulationExpense,
  IncomePeriod,
} from './types';

import {
  loadFinancialData,
  saveFinancialData,
  resetFinancialData,
  calculateProjections,
  calculateRunwayMonths,
  isExpenseActiveInMonth,
  isIncomeActiveInMonth,
} from './utils/storage';

import { initGoogleAuth } from './services/googleSheets';

import {
  addMonths,
  formatMonthYearLabel,
} from './utils/formatters';

export default function App() {
  // =========================================================
  // STATE
  // =========================================================

  const [data, setData] = useState<FinancialData | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isSheetsModalOpen, setIsSheetsModalOpen] =
    useState(false);

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [cachedToken, setCachedToken] =
    useState<string | null>(null);

  // =========================================================
  // TANGGAL BULAN INI
  // =========================================================

  const currentMonthYear = useMemo(() => {
    return new Date().toISOString().slice(0, 7);
  }, []);

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
  // PROJECTION
  //
  // HARUS DIJALANKAN SEBELUM CONDITIONAL RETURN
  // AGAR TIDAK ADA ERROR HOOKS ORDER.
  // =========================================================

  const projections = useMemo(() => {
    if (!data) {
      return [];
    }

    return calculateProjections(data);
  }, [data]);

  // =========================================================
  // ACTIVE EXPENSES BULAN INI
  // =========================================================

  const activeExpensesThisMonth = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.expenses.filter((expense) =>
      isExpenseActiveInMonth(
        expense,
        currentMonthYear
      )
    );
  }, [data, currentMonthYear]);

  // =========================================================
  // TOTAL PENGELUARAN TETAP BULAN INI
  // =========================================================

  const activeFixedExpenseThisMonth =
    activeExpensesThisMonth.reduce(
      (sum, expense) =>
        sum + (Number(expense.amount) || 0),
      0
    );

  // =========================================================
  // PEMASUKAN RUTIN BULAN INI
  // =========================================================

  const currentMonthRegularIncome = data
    ? data.incomePeriods
        .filter((income) =>
          isIncomeActiveInMonth(
            income,
            currentMonthYear
          )
        )
        .reduce(
          (sum, income) =>
            sum + (Number(income.amount) || 0),
          0
        )
    : 0;

  // =========================================================
  // PILIHAN BULAN
  //
  // 60 BULAN = 5 TAHUN
  // =========================================================

  const projectionMonthOptions = useMemo(() => {
    if (!data) {
      return [];
    }

    const options: {
      value: string;
      label: string;
    }[] = [];

    for (let i = 0; i < 60; i++) {
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
  // CURRENT MONTH PROJECTION
  // =========================================================

  const currentMonthProjection =
    projections.find(
      (projection) =>
        projection.monthYear === currentMonthYear
    ) ||
    projections[0] ||
    (data
      ? {
          monthIndex: 0,

          monthYear: currentMonthYear,

          monthLabel:
            formatMonthYearLabel(
              currentMonthYear
            ),

          fullMonthLabel:
            formatMonthYearLabel(
              currentMonthYear
            ),

          startingBalance:
            data.currentBalance,

          regularIncome:
            currentMonthRegularIncome,

          specialIncome: 0,

          totalIncome:
            currentMonthRegularIncome,

          regularExpense:
            activeFixedExpenseThisMonth,

          simulatedExpense: 0,

          totalExpense:
            activeFixedExpenseThisMonth,

          netCashflow:
            currentMonthRegularIncome -
            activeFixedExpenseThisMonth,

          endingBalance:
            data.currentBalance +
            currentMonthRegularIncome -
            activeFixedExpenseThisMonth,

          baselineEndingBalance:
            data.currentBalance +
            currentMonthRegularIncome -
            activeFixedExpenseThisMonth,

          isDeficit:
            currentMonthRegularIncome -
              activeFixedExpenseThisMonth <
            0,

          isNegativeBalance:
            data.currentBalance +
              currentMonthRegularIncome -
              activeFixedExpenseThisMonth <
            0,
        }
      : null);

  // =========================================================
  // RUNWAY
  // =========================================================

  const runway = calculateRunwayMonths(
    projections
  );

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
                  currentMonthYear,

                projectionMonthsCount: 60,

                incomePeriods: [],

                expenses: [],

                specialIncomes: [],

                simulations: [],
              };

              try {
                await saveFinancialData(
                  emptyData
                );

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
  // HANDLER SALDO AWAL
  // =========================================================

  const handleUpdateStartingBalance = (
    newBalance: number
  ) => {
    setData((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        currentBalance: Number(newBalance) || 0,
      };
    });
  };

  // =========================================================
  // HANDLER SALARY / PEMASUKAN RUTIN
  //
  // DashboardSummary lama masih punya tombol edit salary.
  // Sekarang tombol itu akan mengubah income period aktif
  // bulan ini.
  // =========================================================

  const handleUpdateSalary = (
    newSalary: number
  ) => {
    const amount = Number(newSalary) || 0;

    setData((previous) => {
      if (!previous) {
        return previous;
      }

      const activeIncomeIndex =
        previous.incomePeriods.findIndex(
          (income) =>
            isIncomeActiveInMonth(
              income,
              currentMonthYear
            )
        );

      // Kalau belum ada income period aktif,
      // buat income baru.
      if (activeIncomeIndex === -1) {
        const newIncome: IncomePeriod = {
          id: `income-${Date.now()}`,
          name: 'Pemasukan Rutin',
          amount,
          startMonth: currentMonthYear,
          endMonth: undefined,
          notes: '',
        };

        return {
          ...previous,

          incomePeriods: [
            ...previous.incomePeriods,
            newIncome,
          ],
        };
      }

      // Kalau sudah ada income aktif,
      // update income tersebut.
      return {
        ...previous,

        incomePeriods:
          previous.incomePeriods.map(
            (income, index) =>
              index === activeIncomeIndex
                ? {
                    ...income,
                    amount,
                  }
                : income
          ),
      };
    });
  };

  // =========================================================
  // INCOME PERIOD
  // =========================================================

  const handleAddIncomePeriod = (
    income: Omit<IncomePeriod, 'id'>
  ) => {
    const newIncome: IncomePeriod = {
      ...income,
      id: `income-${Date.now()}`,
    };

    setData((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,

        incomePeriods: [
          ...previous.incomePeriods,
          newIncome,
        ],
      };
    });
  };

  const handleUpdateIncomePeriod = (
    id: string,
    updated: Partial<IncomePeriod>
  ) => {
    setData((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,

        incomePeriods:
          previous.incomePeriods.map(
            (income) =>
              income.id === id
                ? {
                    ...income,
                    ...updated,
                  }
                : income
          ),
      };
    });
  };

  const handleDeleteIncomePeriod = (
    id: string
  ) => {
    setData((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,

        incomePeriods:
          previous.incomePeriods.filter(
            (income) =>
              income.id !== id
          ),
      };
    });
  };

  // =========================================================
  // EXPENSE
  // =========================================================

  const handleAddExpense = (
    item: Omit<ExpenseItem, 'id'>
  ) => {
    const newItem: ExpenseItem = {
      ...item,
      id: `exp-${Date.now()}`,
    };

    setData((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,

        expenses: [
          ...previous.expenses,
          newItem,
        ],
      };
    });
  };

  const handleUpdateExpense = (
    id: string,
    updated: Partial<ExpenseItem>
  ) => {
    setData((previous) => {
      if (!previous) {
        return previous;
      }

      return {
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
      };
    });
  };

  const handleDeleteExpense = (
    id: string
  ) => {
    setData((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,

        expenses:
          previous.expenses.filter(
            (expense) =>
              expense.id !== id
          ),
      };
    });
  };

  // =========================================================
  // SPECIAL INCOME
  // =========================================================

  const handleAddSpecialIncome = (
    income: Omit<SpecialIncome, 'id'>
  ) => {
    const newIncome: SpecialIncome = {
      ...income,
      id: `inc-${Date.now()}`,
    };

    setData((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,

        specialIncomes: [
          ...previous.specialIncomes,
          newIncome,
        ],
      };
    });
  };

  const handleDeleteSpecialIncome = (
    id: string
  ) => {
    setData((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,

        specialIncomes:
          previous.specialIncomes.filter(
            (income) =>
              income.id !== id
          ),
      };
    });
  };

  // =========================================================
  // SIMULATION
  // =========================================================

  const handleAddSimulation = (
    simulation: Omit<
      SimulationExpense,
      'id'
    >
  ) => {
    const newSimulation: SimulationExpense = {
      ...simulation,
      id: `sim-${Date.now()}`,
    };

    setData((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,

        simulations: [
          ...previous.simulations,
          newSimulation,
        ],
      };
    });
  };

  const handleToggleSimulation = (
    id: string
  ) => {
    setData((previous) => {
      if (!previous) {
        return previous;
      }

      return {
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
      };
    });
  };

  const handleDeleteSimulation = (
    id: string
  ) => {
    setData((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,

        simulations:
          previous.simulations.filter(
            (simulation) =>
              simulation.id !== id
          ),
      };
    });
  };

  // =========================================================
  // JUMLAH BULAN PROJECTION
  // =========================================================

  const handleMonthsCountChange = (
    count: number
  ) => {
    setData((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,

        projectionMonthsCount:
          Math.max(
            1,
            Math.min(60, count)
          ),
      };
    });
  };

  // =========================================================
  // RESET DATA
  // =========================================================

  const handleResetData = async () => {
    const confirmed = window.confirm(
      'Yakin mau menghapus seluruh data financial dan mulai dari kosong?'
    );

    if (!confirmed) {
      return;
    }

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

        {currentMonthProjection && (
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

            onUpdateSalary={
              handleUpdateSalary
            }

            onUpdateStartingBalance={
              handleUpdateStartingBalance
            }
          />
        )}

        {/* ===================================================
            PEMASUKAN RUTIN
        =================================================== */}

        <IncomePeriodManager
          incomePeriods={
            data.incomePeriods
          }

          projectionMonthOptions={
            projectionMonthOptions
          }

          onAddIncomePeriod={
            handleAddIncomePeriod
          }

          onUpdateIncomePeriod={
            handleUpdateIncomePeriod
          }

          onDeleteIncomePeriod={
            handleDeleteIncomePeriod
          }
        />

        {/* ===================================================
            GRAFIK
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
            EXPENSE + SIMULATION
        =================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* =================================================
              EXPENSE
          ================================================= */}

          <div className="lg:col-span-7 space-y-6">

            <ExpenseList
              expenses={
                data.expenses
              }

              currentMonthYear={
                currentMonthYear
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
              RIGHT SIDE
          ================================================= */}

          <div className="lg:col-span-5 space-y-6">

            {/* ===============================================
                WHAT IF
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