import React, { useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Edit2,
  Check,
  ShieldAlert,
  Info
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { MonthProjection } from '../types';

interface DashboardSummaryProps {
  monthlySalary: number;
  startingBalance: number;
  currentMonthProjection: MonthProjection;
  firstNegativeMonthLabel: string | null;
  monthsRemaining: number | null;
  onUpdateSalary: (newSalary: number) => void;
  onUpdateStartingBalance: (newBalance: number) => void;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  monthlySalary,
  startingBalance,
  currentMonthProjection,
  firstNegativeMonthLabel,
  monthsRemaining,
  onUpdateSalary,
  onUpdateStartingBalance
}) => {
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [tempSalary, setTempSalary] = useState(monthlySalary.toString());

  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [tempBalance, setTempBalance] = useState(startingBalance.toString());

  const handleSaveSalary = () => {
    const num = parseFloat(tempSalary.replace(/\D/g, ''));
    if (!isNaN(num) && num >= 0) {
      onUpdateSalary(num);
    }
    setIsEditingSalary(false);
  };

  const handleSaveBalance = () => {
    const num = parseFloat(tempBalance.replace(/\D/g, ''));
    if (!isNaN(num) && num >= 0) {
      onUpdateStartingBalance(num);
    }
    setIsEditingBalance(false);
  };

  const netCashflow = currentMonthProjection.netCashflow;
  const isDeficit = netCashflow < 0;

  return (
    <section id="dashboard-summary-section" className="space-y-4">
      {/* Critical Alert Banner if in Deficit */}
      {isDeficit && (
        <div
          id="cashflow-deficit-warning"
          className="rounded-xl border border-rose-300 bg-rose-50/90 p-4 sm:p-4.5 text-rose-950 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-rose-900 text-base">
                  Perhatian: Arus Kas Bulanan Defisit ({formatRupiah(netCashflow)})
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-200 text-rose-800">
                  Pengeluaran &gt; Pemasukan
                </span>
              </div>
              <p className="mt-1 text-rose-950/90 leading-relaxed">
                Pengeluaran tetap bulanan ({formatRupiah(currentMonthProjection.totalExpense)}) lebih besar dari pemasukan rutin ({formatRupiah(currentMonthProjection.totalIncome)}).
                {firstNegativeMonthLabel ? (
                  <>
                    {' '}Dengan kondisi ini, tabungan Anda diperkirakan akan <strong>habis/minus pada {firstNegativeMonthLabel}</strong> ({monthsRemaining} bulan ke depan) jika tidak ada penghematan atau pemasukan ekstra.
                  </>
                ) : (
                  ' Tabungan Anda masih mencukupi dalam periode proyeksi saat ini, namun terus mengalami pengikisan.'
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Saldo Tabungan Saat Ini */}
        <div
          id="card-current-savings"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-700 mb-1.5">
            <span className="text-xs font-medium uppercase tracking-wider">Saldo Tabungan Saat Ini</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="my-1">
            {isEditingBalance ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="text"
                  value={tempBalance}
                  onChange={e => setTempBalance(e.target.value)}
                  className="w-full text-base font-bold px-2 py-1 border rounded border-indigo-400 focus:outline-hidden"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleSaveBalance()}
                />
                <button
                  type="button"
                  onClick={handleSaveBalance}
                  className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-baseline justify-between group">
                <div className="text-2xl font-black tracking-tight text-slate-900">
                  {formatRupiah(startingBalance)}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempBalance(startingBalance.toString());
                    setIsEditingBalance(true);
                  }}
                  className="text-slate-700 hover:text-indigo-600 p-1 rounded hover:bg-slate-100 transition-colors"
                  title="Ubah saldo tabungan saat ini"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-700 flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
            <span>Posisi per September 2026</span>
            <span className="font-medium text-slate-700">Modal Awal</span>
          </div>
        </div>

        {/* Card 2: Total Pemasukan Bulan Ini */}
        <div
          id="card-current-income"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-700 mb-1.5">
            <span className="text-xs font-medium uppercase tracking-wider">Total Pemasukan (Bulan Ini)</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="my-1">
            {isEditingSalary ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="text"
                  value={tempSalary}
                  onChange={e => setTempSalary(e.target.value)}
                  className="w-full text-base font-bold px-2 py-1 border rounded border-emerald-400 focus:outline-hidden"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleSaveSalary()}
                />
                <button
                  type="button"
                  onClick={handleSaveSalary}
                  className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-baseline justify-between group">
                <div className="text-2xl font-black tracking-tight text-emerald-700">
                  {formatRupiah(currentMonthProjection.totalIncome)}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempSalary(monthlySalary.toString());
                    setIsEditingSalary(true);
                  }}
                  className="text-slate-700 hover:text-emerald-600 p-1 rounded hover:bg-slate-100 transition-colors"
                  title="Ubah gaji bulanan"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-700 flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
            <span>Gaji: {formatRupiah(monthlySalary)}</span>
            {currentMonthProjection.specialIncome > 0 && (
              <span className="text-emerald-700 font-semibold">
                +{formatRupiah(currentMonthProjection.specialIncome)} Khusus
              </span>
            )}
            {currentMonthProjection.specialIncome === 0 && (
              <span className="text-slate-700">Awal Bulan</span>
            )}
          </div>
        </div>

        {/* Card 3: Total Pengeluaran Tetap */}
        <div
          id="card-current-expenses"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-700 mb-1.5">
            <span className="text-xs font-medium uppercase tracking-wider">Total Pengeluaran Tetap</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>

          <div className="my-1">
            <div className="text-2xl font-black tracking-tight text-rose-700">
              {formatRupiah(currentMonthProjection.totalExpense)}
            </div>
          </div>

          <div className="text-xs text-slate-700 flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
            <span>8 Item Tagihan & Rutin</span>
            {currentMonthProjection.simulatedExpense > 0 ? (
              <span className="text-amber-700 font-semibold">
                +{formatRupiah(currentMonthProjection.simulatedExpense)} Simulasi
              </span>
            ) : (
              <span className="text-rose-700 font-medium">Beban Tetap</span>
            )}
          </div>
        </div>

        {/* Card 4: Sisa Saldo Akhir Bulan Ini */}
        <div
          id="card-ending-balance-highlight"
          className={`rounded-xl p-4 border shadow-xs transition-all flex flex-col justify-between ${
            currentMonthProjection.endingBalance < 0
              ? 'bg-rose-50 border-rose-300'
              : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-xs font-medium uppercase tracking-wider ${
                currentMonthProjection.endingBalance < 0 ? 'text-rose-700' : 'text-slate-300'
              }`}
            >
              Proyeksi Sisa Saldo Akhir Bulan
            </span>
            <div
              className={`p-1.5 rounded-lg ${
                currentMonthProjection.endingBalance < 0
                  ? 'bg-rose-200 text-rose-800'
                  : 'bg-slate-800 text-emerald-400'
              }`}
            >
              {isDeficit ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </div>
          </div>

          <div className="my-1">
            <div
              className={`text-2xl font-black tracking-tight ${
                currentMonthProjection.endingBalance < 0
                  ? 'text-rose-900'
                  : 'text-emerald-400'
              }`}
            >
              {formatRupiah(currentMonthProjection.endingBalance)}
            </div>
          </div>

          <div
            className={`text-xs flex items-center justify-between pt-2 border-t mt-2 ${
              currentMonthProjection.endingBalance < 0
                ? 'border-rose-200 text-rose-700 font-semibold'
                : 'border-slate-800 text-slate-300'
            }`}
          >
            <span>Arus Kas:</span>
            <span
              className={`font-semibold ${
                isDeficit
                  ? currentMonthProjection.endingBalance < 0
                    ? 'text-rose-700'
                    : 'text-rose-400'
                  : 'text-emerald-400'
              }`}
            >
              {formatRupiah(netCashflow, true)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
