import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Area,
  ComposedChart
} from 'recharts';
import { MonthProjection } from '../types';
import { formatRupiah, formatCompactRupiah } from '../utils/formatters';
import { TrendingDown, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

interface ProjectionChartProps {
  projections: MonthProjection[];
  hasActiveSimulations: boolean;
  monthsCount: number;
  onMonthsCountChange: (count: number) => void;
}

export const ProjectionChart: React.FC<ProjectionChartProps> = ({
  projections,
  hasActiveSimulations,
  monthsCount,
  onMonthsCountChange
}) => {
  const chartData = projections.map(p => ({
    name: p.monthLabel,
    fullName: p.fullMonthLabel,
    saldo: p.endingBalance,
    baselineSaldo: p.baselineEndingBalance,
    pemasukan: p.totalIncome,
    pengeluaran: p.totalExpense,
    netCashflow: p.netCashflow,
    isNegative: p.isNegativeBalance
  }));

  const minBalance = Math.min(...chartData.map(d => Math.min(d.saldo, d.baselineSaldo, 0)));
  const maxBalance = Math.max(...chartData.map(d => Math.max(d.saldo, d.baselineSaldo)));
  const yDomainMin = minBalance < 0 ? Math.floor(minBalance * 1.15) : 0;
  const yDomainMax = Math.ceil(maxBalance * 1.1);

  const lowestPoint = chartData.reduce((min, d) => (d.saldo < min.saldo ? d : min), chartData[0]);

  return (
    <div id="projection-chart-container" className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Grafik Proyeksi Saldo Tabungan
            </h2>
            {lowestPoint && lowestPoint.saldo < 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">
                <AlertTriangle className="w-3 h-3" />
                Tren Turun & Kritis
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 mt-0.5">
            Tren pergerakan akumulasi saldo tabungan dari bulan ke bulan
          </p>
        </div>

        {/* Time horizon pill selector (6, 12, 24 bulan) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs">
          {[6, 12, 24].map(count => (
            <button
              key={count}
              type="button"
              onClick={() => onMonthsCountChange(count)}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                monthsCount === count
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {count} Bulan
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <YAxis
              domain={[yDomainMin, yDomainMax]}
              tickFormatter={val => formatCompactRupiah(val)}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              width={70}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700 min-w-52">
                      <p className="font-bold text-slate-200 border-b border-slate-700 pb-1.5 mb-1.5">
                        {data.fullName}
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-slate-300">
                          <span>Pemasukan:</span>
                          <span className="font-semibold text-emerald-400">
                            {formatRupiah(data.pemasukan)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>Pengeluaran:</span>
                          <span className="font-semibold text-rose-400">
                            {formatRupiah(data.pengeluaran)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>Cashflow Bulan Ini:</span>
                          <span
                            className={`font-semibold ${
                              data.netCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {formatRupiah(data.netCashflow, true)}
                          </span>
                        </div>
                        <div className="border-t border-slate-700 pt-1.5 mt-1.5 flex justify-between items-center">
                          <span className="font-bold text-white">Saldo Akhir:</span>
                          <span
                            className={`font-black text-sm ${
                              data.saldo < 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {formatRupiah(data.saldo)}
                          </span>
                        </div>
                        {hasActiveSimulations && (
                          <div className="flex justify-between items-center text-[11px] text-indigo-300 pt-0.5">
                            <span>Baseline (tanpa simulasi):</span>
                            <span>{formatRupiah(data.baselineSaldo)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Reference Line at Rp 0 */}
            <ReferenceLine
              y={0}
              stroke="#e11d48"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              label={{
                value: 'Batas Kritis (Rp 0)',
                fill: '#e11d48',
                fontSize: 10,
                position: 'insideBottomRight'
              }}
            />

            {/* Baseline Line if simulation active */}
            {hasActiveSimulations && (
              <Line
                type="monotone"
                dataKey="baselineSaldo"
                name="Baseline (Tanpa Simulasi)"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#94a3b8' }}
              />
            )}

            {/* Main Balance Line */}
            <Line
              type="monotone"
              dataKey="saldo"
              name={hasActiveSimulations ? "Saldo (Dengan Simulasi)" : "Saldo Tabungan"}
              stroke="#4f46e5"
              strokeWidth={3}
              dot={props => {
                const { cx, cy, payload } = props;
                const isNegative = payload.saldo < 0;
                return (
                  <circle
                    key={`dot-${payload.name}`}
                    cx={cx}
                    cy={cy}
                    r={isNegative ? 5 : 4}
                    fill={isNegative ? '#e11d48' : '#4f46e5'}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 7, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info / Legend Summary */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
            <span className="font-medium text-slate-700">Saldo Akhir Bulanan</span>
          </div>
          {hasActiveSimulations && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-b-2 border-slate-400 border-dashed inline-block" />
              <span>Baseline Rutin</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-600 inline-block" />
            <span className="text-rose-700 font-medium">Batas Saldo Nol (Minus)</span>
          </div>
        </div>

        <div>
          <span>
            Titik Terendah: <strong className={lowestPoint.saldo < 0 ? 'text-rose-700 font-bold' : 'text-slate-800'}>{formatRupiah(lowestPoint.saldo)}</strong> ({lowestPoint.fullName})
          </span>
        </div>
      </div>
    </div>
  );
};
