import React, { useState } from 'react';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { MonthProjection } from '../types';
import { formatRupiah } from '../utils/formatters';

interface SavingsTrackerProps {
  projections: MonthProjection[];
  startingBalance: number;
  onUpdateStartingBalance: (val: number) => void;
  firstNegativeMonthLabel: string | null;
  monthsRemaining: number | null;
}

export const SavingsTracker: React.FC<SavingsTrackerProps> = ({
  projections,
  startingBalance,
  onUpdateStartingBalance,
  firstNegativeMonthLabel,
  monthsRemaining
}) => {
  const [balanceInput, setBalanceInput] = useState(startingBalance.toString());

  const handleApplyBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = parseFloat(balanceInput.replace(/\D/g, ''));
    if (!isNaN(cleanNum) && cleanNum >= 0) {
      onUpdateStartingBalance(cleanNum);
    }
  };

  return (
    <div id="savings-tracker-container" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header bar with starting balance edit */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Tracker & Proyeksi Saldo Bulanan
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
              {projections.length} Bulan
            </span>
          </div>
          <p className="text-xs text-slate-700 mt-0.5">
            Perhitungan otomatis akumulasi saldo: Saldo Awal + Pemasukan − Pengeluaran = Saldo Akhir
          </p>
        </div>

        {/* Edit Starting Balance Form */}
        <form onSubmit={handleApplyBalance} className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Saldo Awal:
          </label>
          <div className="relative">
            <input
              type="text"
              value={balanceInput}
              onChange={e => setBalanceInput(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 w-36 border rounded-lg border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              placeholder="10300000"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Update
          </button>
        </form>
      </div>

      {/* Runway Alert Summary Bar */}
      {firstNegativeMonthLabel ? (
        <div className="bg-rose-50 border-b border-rose-200 px-4 sm:px-5 py-3 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-950">
            <span className="font-bold text-rose-900">
              Peringatan Defisit: Tabungan diperkirakan minus di {firstNegativeMonthLabel}!
            </span>
            <p className="mt-0.5 text-rose-950/90">
              Berdasarkan simulasi pengeluaran rutin, saldo tabungan Anda hanya bertahan selama{' '}
              <strong>{monthsRemaining} bulan</strong> sebelum menjadi negatif. Disarankan untuk menekan pengeluaran cicilan/jajan atau mencari pemasukan tambahan.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 sm:px-5 py-2.5 flex items-center gap-2 text-xs text-emerald-950">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-emerald-900">
            Kondisi Aman: Saldo tabungan diproyeksikan tetap positif selama periode {projections.length} bulan ke depan.
          </span>
        </div>
      )}

      {/* Responsive Table of Monthly Projections */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Bulan</th>
              <th className="py-3 px-4 text-right">Saldo Awal</th>
              <th className="py-3 px-4 text-right">Total Pemasukan</th>
              <th className="py-3 px-4 text-right">Total Pengeluaran</th>
              <th className="py-3 px-4 text-right">Net Cashflow</th>
              <th className="py-3 px-4 text-right">Saldo Akhir</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projections.map((p, idx) => {
              const isNegative = p.endingBalance < 0;
              const isLow = p.endingBalance >= 0 && p.endingBalance < 2000000;

              return (
                <tr
                  key={p.monthYear}
                  className={`transition-colors ${
                    isNegative
                      ? 'bg-rose-50/80 hover:bg-rose-100/70'
                      : isLow
                      ? 'bg-amber-50/40 hover:bg-amber-50/80'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  {/* Bulan */}
                  <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-slate-700 text-[10px]">#{idx + 1}</span>
                      <span>{p.fullMonthLabel}</span>
                      {p.specialIncome > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          +Bonus Khusus
                        </span>
                      )}
                      {p.simulatedExpense > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                          +Simulasi
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Saldo Awal */}
                  <td className="py-3 px-4 text-right text-slate-700 whitespace-nowrap">
                    {formatRupiah(p.startingBalance)}
                  </td>

                  {/* Total Pemasukan */}
                  <td className="py-3 px-4 text-right text-emerald-700 font-medium whitespace-nowrap">
                    <div>
                      {formatRupiah(p.totalIncome)}
                      {p.specialIncome > 0 && (
                        <div className="text-[10px] text-emerald-700 font-normal">
                          (Gaji {formatRupiah(p.regularIncome)} + Khusus {formatRupiah(p.specialIncome)})
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Total Pengeluaran */}
                  <td className="py-3 px-4 text-right text-rose-700 font-medium whitespace-nowrap">
                    <div>
                      {formatRupiah(p.totalExpense)}
                      {p.simulatedExpense > 0 && (
                        <div className="text-[10px] text-amber-700 font-normal">
                          (Rutin {formatRupiah(p.regularExpense)} + Extra {formatRupiah(p.simulatedExpense)})
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Net Cashflow */}
                  <td className="py-3 px-4 text-right font-semibold whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-0.5 ${
                        p.netCashflow < 0 ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {p.netCashflow < 0 ? (
                        <TrendingDown className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingUp className="w-3.5 h-3.5" />
                      )}
                      {formatRupiah(p.netCashflow, true)}
                    </span>
                  </td>

                  {/* Saldo Akhir */}
                  <td className="py-3 px-4 text-right whitespace-nowrap font-black">
                    <span
                      className={`text-sm ${
                        isNegative
                          ? 'text-rose-900 underline decoration-rose-400 font-extrabold'
                          : isLow
                          ? 'text-amber-800'
                          : 'text-slate-900'
                      }`}
                    >
                      {formatRupiah(p.endingBalance)}
                    </span>
                  </td>

                  {/* Status Indicator */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {isNegative ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-200 text-rose-900 shadow-xs animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-700" />
                        MINUS / DEFISIT
                      </span>
                    ) : isLow ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                        Waspada (&lt; 2jt)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Aman
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
