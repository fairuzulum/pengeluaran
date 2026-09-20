import React, { useMemo } from 'react';

import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from 'recharts';

import { MonthProjection } from '../types';

import {
  formatRupiah,
  formatCompactRupiah,
} from '../utils/formatters';

import {
  AlertTriangle,
} from 'lucide-react';

interface ProjectionChartProps {
  projections: MonthProjection[];
  hasActiveSimulations: boolean;
  monthsCount: number;
  onMonthsCountChange: (
    count: number
  ) => void;
}

export const ProjectionChart: React.FC<
  ProjectionChartProps
> = ({
  projections,
  hasActiveSimulations,
  monthsCount,
  onMonthsCountChange,
}) => {
  const chartData = useMemo(() => {
    return projections
      .slice(0, monthsCount)
      .map((p) => ({
        name: p.monthLabel,
        fullName: p.fullMonthLabel,

        saldo: Number(p.endingBalance) || 0,

        baselineSaldo:
          Number(
            p.baselineEndingBalance
          ) || 0,

        pemasukan:
          Number(p.totalIncome) || 0,

        pengeluaran:
          Number(p.totalExpense) || 0,

        netCashflow:
          Number(p.netCashflow) || 0,

        isNegative:
          p.isNegativeBalance,
      }));
  }, [
    projections,
    monthsCount,
  ]);

  const chartStats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        min: 0,
        max: 1000000,
        lowestPoint: null,
      };
    }

    const values = chartData.flatMap(
      (item) => [
        item.saldo,
        item.baselineSaldo,
        0,
      ]
    );

    let min = Math.min(...values);
    let max = Math.max(...values);

    // Kalau semua angka sama, beri ruang
    // supaya grafik tidak menjadi garis domain 0..0.
    if (min === max) {
      const padding =
        Math.max(
          Math.abs(min) * 0.2,
          1000000
        );

      min -= padding;
      max += padding;
    } else {
      const range = max - min;

      min -= range * 0.1;
      max += range * 0.1;
    }

    const lowestPoint =
      chartData.reduce(
        (lowest, item) =>
          item.saldo <
          lowest.saldo
            ? item
            : lowest,
        chartData[0]
      );

    return {
      min,
      max,
      lowestPoint,
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-lg font-bold text-slate-900">
          Grafik Proyeksi Saldo Tabungan
        </h2>

        <div className="h-72 flex items-center justify-center text-sm text-slate-500">
          Belum ada data proyeksi.
        </div>
      </div>
    );
  }

  const {
    min,
    max,
    lowestPoint,
  } = chartStats;

  return (
    <div
      id="projection-chart-container"
      className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5"
    >
      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Grafik Proyeksi Saldo Tabungan
            </h2>

            {lowestPoint &&
              lowestPoint.saldo < 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">
                  <AlertTriangle className="w-3 h-3" />
                  Minus
                </span>
              )}
          </div>

          <p className="text-xs text-slate-500 mt-0.5">
            Proyeksi saldo berdasarkan pemasukan,
            pengeluaran, dan simulasi aktif.
          </p>
        </div>

        {/* HORIZON */}

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          {[6, 12, 24].map(
            (count) => (
              <button
                key={count}
                type="button"
                onClick={() =>
                  onMonthsCountChange(
                    count
                  )
                }
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  monthsCount === count
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {count} Bulan
              </button>
            )
          )}
        </div>
      </div>

      {/* CHART */}

      <div className="h-72 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <ComposedChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: 10,
              bottom: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={{
                stroke: '#cbd5e1',
              }}
              tick={{
                fill: '#64748b',
                fontSize: 11,
              }}
            />

            <YAxis
              domain={[min, max]}
              tickFormatter={(value) =>
                formatCompactRupiah(
                  value
                )
              }
              tickLine={false}
              axisLine={{
                stroke: '#cbd5e1',
              }}
              tick={{
                fill: '#64748b',
                fontSize: 11,
              }}
              width={70}
            />

            <Tooltip
              content={({
                active,
                payload,
              }) => {
                if (
                  !active ||
                  !payload ||
                  payload.length === 0
                ) {
                  return null;
                }

                const item =
                  payload[0]
                    .payload;

                return (
                  <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700 min-w-52">
                    <p className="font-bold text-slate-200 border-b border-slate-700 pb-1.5 mb-1.5">
                      {item.fullName}
                    </p>

                    <div className="space-y-1">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-300">
                          Pemasukan:
                        </span>

                        <span className="font-semibold text-emerald-400">
                          {formatRupiah(
                            item.pemasukan
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-slate-300">
                          Pengeluaran:
                        </span>

                        <span className="font-semibold text-rose-400">
                          {formatRupiah(
                            item.pengeluaran
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-slate-300">
                          Cashflow:
                        </span>

                        <span
                          className={`font-semibold ${
                            item.netCashflow >=
                            0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {formatRupiah(
                            item.netCashflow,
                            true
                          )}
                        </span>
                      </div>

                      <div className="border-t border-slate-700 pt-1.5 mt-1.5 flex justify-between gap-4">
                        <span className="font-bold">
                          Saldo Akhir:
                        </span>

                        <span
                          className={`font-black ${
                            item.saldo <
                            0
                              ? 'text-rose-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {formatRupiah(
                            item.saldo
                          )}
                        </span>
                      </div>

                      {hasActiveSimulations && (
                        <div className="flex justify-between gap-4 text-indigo-300">
                          <span>
                            Baseline:
                          </span>

                          <span>
                            {formatRupiah(
                              item.baselineSaldo
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />

            <ReferenceLine
              y={0}
              stroke="#e11d48"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />

            {hasActiveSimulations && (
              <Line
                type="monotone"
                dataKey="baselineSaldo"
                name="Baseline"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}

            <Line
              type="monotone"
              dataKey="saldo"
              name="Saldo"
              stroke="#4f46e5"
              strokeWidth={3}
              dot={{
                r: 3,
              }}
              activeDot={{
                r: 6,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* FOOTER */}

      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div>
          Menampilkan proyeksi{' '}
          <strong>
            {chartData.length}
          </strong>{' '}
          bulan.
        </div>

        {lowestPoint && (
          <div>
            Titik terendah:{' '}
            <strong
              className={
                lowestPoint.saldo <
                0
                  ? 'text-rose-700'
                  : 'text-slate-800'
              }
            >
              {formatRupiah(
                lowestPoint.saldo
              )}
            </strong>{' '}
            ({lowestPoint.fullName})
          </div>
        )}
      </div>
    </div>
  );
};