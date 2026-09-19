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
  SimulationExpense
} from './types';
import {
  loadFinancialData,
  saveFinancialData,
  resetFinancialData,
  calculateProjections,
  calculateRunwayMonths,
  isExpenseActiveInMonth
} from './utils/storage';
import { initGoogleAuth } from './services/googleSheets';
import { addMonths, formatMonthYearLabel } from './utils/formatters';

export default function App() {
  const [data, setData] = useState<FinancialData>(() => loadFinancialData());
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cachedToken, setCachedToken] = useState<string | null>(null);

  // Initialize Google Auth state listener
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setCurrentUser(user);
        setCachedToken(token);
      },
      () => {
        // Not authenticated or token absent
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    saveFinancialData(data);
  }, [data]);

  // Derived Projections and Runway calculations
  const projections = useMemo(() => {
    return calculateProjections(data);
  }, [data]);

  const activeExpensesThisMonth = useMemo(
    () => data.expenses.filter(e => isExpenseActiveInMonth(e, data.startingMonthYear)),
    [data.expenses, data.startingMonthYear]
  );
  const activeFixedExpenseThisMonth = activeExpensesThisMonth.reduce(
    (s, e) => s + (Number(e.amount) || 0),
    0
  );

  const currentMonthProjection = projections[0] || {
    monthIndex: 0,
    monthYear: data.startingMonthYear,
    monthLabel: 'Sep 2026',
    fullMonthLabel: 'September 2026',
    startingBalance: data.startingBalance,
    regularIncome: data.monthlySalary,
    specialIncome: 0,
    totalIncome: data.monthlySalary,
    regularExpense: activeFixedExpenseThisMonth,
    simulatedExpense: 0,
    totalExpense: activeFixedExpenseThisMonth,
    netCashflow: data.monthlySalary - activeFixedExpenseThisMonth,
    endingBalance: data.startingBalance + (data.monthlySalary - activeFixedExpenseThisMonth),
    baselineEndingBalance: data.startingBalance + (data.monthlySalary - activeFixedExpenseThisMonth),
    isDeficit: true,
    isNegativeBalance: false
  };

  const runway = useMemo(() => {
    return calculateRunwayMonths(projections);
  }, [projections]);

  // Month selection options for forms (e.g. next 18 months)
  const projectionMonthOptions = useMemo(() => {
    const opts = [];
    for (let i = 0; i < 24; i++) {
      const my = addMonths(data.startingMonthYear, i);
      opts.push({
        value: my,
        label: formatMonthYearLabel(my)
      });
    }
    return opts;
  }, [data.startingMonthYear]);

  // Handlers
  const handleUpdateSalary = (newSalary: number) => {
    setData(prev => ({ ...prev, monthlySalary: newSalary }));
  };

  const handleUpdateStartingBalance = (newBalance: number) => {
    setData(prev => ({ ...prev, startingBalance: newBalance }));
  };

  const handleAddExpense = (item: Omit<ExpenseItem, 'id'>) => {
    const newItem: ExpenseItem = {
      ...item,
      id: `exp-${Date.now()}`
    };
    setData(prev => ({
      ...prev,
      expenses: [...prev.expenses, newItem]
    }));
  };

  const handleUpdateExpense = (id: string, updated: Partial<ExpenseItem>) => {
    setData(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => (e.id === id ? { ...e, ...updated } : e))
    }));
  };

  const handleDeleteExpense = (id: string) => {
    setData(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id)
    }));
  };

  const handleAddSpecialIncome = (income: Omit<SpecialIncome, 'id'>) => {
    const newInc: SpecialIncome = {
      ...income,
      id: `inc-${Date.now()}`
    };
    setData(prev => ({
      ...prev,
      specialIncomes: [...prev.specialIncomes, newInc]
    }));
  };

  const handleDeleteSpecialIncome = (id: string) => {
    setData(prev => ({
      ...prev,
      specialIncomes: prev.specialIncomes.filter(i => i.id !== id)
    }));
  };

  const handleAddSimulation = (sim: Omit<SimulationExpense, 'id'>) => {
    const newSim: SimulationExpense = {
      ...sim,
      id: `sim-${Date.now()}`
    };
    setData(prev => ({
      ...prev,
      simulations: [...prev.simulations, newSim]
    }));
  };

  const handleToggleSimulation = (id: string) => {
    setData(prev => ({
      ...prev,
      simulations: prev.simulations.map(s =>
        s.id === id ? { ...s, isActive: !s.isActive } : s
      )
    }));
  };

  const handleDeleteSimulation = (id: string) => {
    setData(prev => ({
      ...prev,
      simulations: prev.simulations.filter(s => s.id !== id)
    }));
  };

  const handleMonthsCountChange = (count: number) => {
    setData(prev => ({
      ...prev,
      projectionMonthsCount: count
    }));
  };

  const handleResetData = () => {
    const fresh = resetFinancialData();
    setData(fresh);
  };

  const totalFixedExpense = activeFixedExpenseThisMonth;
  const hasActiveSimulations = data.simulations.some(s => s.isActive);

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 font-sans antialiased pb-16">
      {/* App Header */}
      <Header
        startingBalance={data.startingBalance}
        totalExpense={totalFixedExpense}
        monthlySalary={data.monthlySalary}
        onResetData={handleResetData}
        onOpenGoogleSheetsModal={() => setIsSheetsModalOpen(true)}
        hasActiveGoogleAuth={Boolean(currentUser && cachedToken)}
        userEmail={currentUser?.email}
      />

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* 1. Dashboard Utama: Ringkasan Bulan Berjalan & Runway Alert */}
        <DashboardSummary
          monthlySalary={data.monthlySalary}
          startingBalance={data.startingBalance}
          currentMonthProjection={currentMonthProjection}
          firstNegativeMonthLabel={runway.firstNegativeMonthLabel}
          monthsRemaining={runway.monthsRemaining}
          onUpdateSalary={handleUpdateSalary}
          onUpdateStartingBalance={handleUpdateStartingBalance}
        />

        {/* 2. Grafik Proyeksi Saldo (6-12-24 bulan) */}
        <ProjectionChart
          projections={projections}
          hasActiveSimulations={hasActiveSimulations}
          monthsCount={data.projectionMonthsCount}
          onMonthsCountChange={handleMonthsCountChange}
        />

        {/* 3. Grid Dua Kolom: Rincian Pengeluaran Tetap & Skenario Simulasi/Pemasukan */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Main: Rincian Pengeluaran Tetap Bulanan */}
          <div className="lg:col-span-7 space-y-6">
            <ExpenseList
              expenses={data.expenses}
              currentMonthYear={data.startingMonthYear}
              monthOptions={projectionMonthOptions}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          </div>

          {/* Right: Simulasi What-If & Pemasukan Khusus */}
          <div className="lg:col-span-5 space-y-6">
            <WhatIfSimulation
              simulations={data.simulations}
              projections={projections}
              projectionMonthOptions={projectionMonthOptions}
              onAddSimulation={handleAddSimulation}
              onToggleSimulation={handleToggleSimulation}
              onDeleteSimulation={handleDeleteSimulation}
            />

            <SpecialIncomeManager
              specialIncomes={data.specialIncomes}
              projectionMonthOptions={projectionMonthOptions}
              onAddSpecialIncome={handleAddSpecialIncome}
              onDeleteSpecialIncome={handleDeleteSpecialIncome}
            />
          </div>
        </div>

        {/* 4. Tracker & Tabel Proyeksi Saldo Bulanan Lengkap */}
        <SavingsTracker
          projections={projections}
          startingBalance={data.startingBalance}
          onUpdateStartingBalance={handleUpdateStartingBalance}
          firstNegativeMonthLabel={runway.firstNegativeMonthLabel}
          monthsRemaining={runway.monthsRemaining}
        />
      </main>

      {/* Google Sheets Sync Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        currentUser={currentUser}
        cachedToken={cachedToken}
        onAuthSuccess={(user, token) => {
          setCurrentUser(user);
          setCachedToken(token);
        }}
        onAuthLogout={() => {
          setCurrentUser(null);
          setCachedToken(null);
        }}
        financialData={data}
        projections={projections}
      />
    </div>
  );
}