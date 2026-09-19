import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  TrendingDown,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Check
} from 'lucide-react';
import { SimulationExpense, MonthProjection } from '../types';
import { formatRupiah, formatMonthYearLabel } from '../utils/formatters';

interface WhatIfSimulationProps {
  simulations: SimulationExpense[];
  projections: MonthProjection[];
  projectionMonthOptions: { value: string; label: string }[];
  onAddSimulation: (sim: Omit<SimulationExpense, 'id'>) => void;
  onToggleSimulation: (id: string) => void;
  onDeleteSimulation: (id: string) => void;
}

export const WhatIfSimulation: React.FC<WhatIfSimulationProps> = ({
  simulations,
  projections,
  projectionMonthOptions,
  onAddSimulation,
  onToggleSimulation,
  onDeleteSimulation
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [monthYear, setMonthYear] = useState(
    projectionMonthOptions[1]?.value || projectionMonthOptions[0]?.value || '2026-10'
  );
  const [notes, setNotes] = useState('');

  const activeSimulations = simulations.filter(s => s.isActive);
  const totalSimulatedAmount = activeSimulations.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const numAmount = parseFloat(amount.replace(/\D/g, '')) || 0;
    if (numAmount <= 0) return;

    onAddSimulation({
      name: name.trim(),
      amount: numAmount,
      monthYear,
      isActive: true,
      notes: notes.trim()
    });

    setName('');
    setAmount('');
    setNotes('');
    setIsAdding(false);
  };

  // Find impact on the first simulated month
  const firstActiveMonth = activeSimulations[0]?.monthYear;
  const affectedProjection = projections.find(p => p.monthYear === firstActiveMonth);

  return (
    <div id="what-if-simulation-container" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-amber-100 text-amber-800">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Simulasi "What-If" (Pengeluaran Mendadak)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              {activeSimulations.length} Aktif
            </span>
          </div>
          <p className="text-xs text-slate-700 mt-0.5">
            Coba simulasi pengeluaran tambahan tanpa mengubah data asli untuk melihat dampaknya ke sisa saldo
          </p>
        </div>

        <button
          id="btn-add-simulation-item"
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Skenario</span>
        </button>
      </div>

      {/* Impact summary banner if there are active simulations */}
      {activeSimulations.length > 0 && affectedProjection && (
        <div className="bg-amber-50/80 px-4 sm:px-5 py-3 border-b border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <span className="font-bold text-amber-900">
                Dampak Simulasi Aktif: -{formatRupiah(totalSimulatedAmount)} total beban ekstra
              </span>
              <p className="text-amber-950/90 text-[11px]">
                Di bulan {affectedProjection.fullMonthLabel}, saldo akhir menjadi{' '}
                <strong>{formatRupiah(affectedProjection.endingBalance)}</strong> (turun dari{' '}
                {formatRupiah(affectedProjection.baselineEndingBalance)}).
              </p>
            </div>
          </div>
          <div className="text-[11px] font-semibold text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-md self-start sm:self-auto">
            Skenario Coba Dulu (Bisa Dinonaktifkan)
          </div>
        </div>
      )}

      {/* Form Add New Scenario */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 bg-amber-50/40 border-b border-amber-200 animate-in fade-in">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-3">
            Buat Skenario Pengeluaran Baru
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pengeluaran / Kebutuhan
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Ganti Ban Motor, Kondangan, Servis AC"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimasi Biaya (Rp)
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 500000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bulan Terjadinya
              </label>
              <select
                value={monthYear}
                onChange={e => setMonthYear(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              >
                {projectionMonthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-2">
            <input
              type="text"
              placeholder="Catatan / keterangan tambahan (opsional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-1.5 border rounded-lg bg-white border-slate-300 focus:outline-hidden"
            />
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs"
            >
              Tambahkan ke Simulasi
            </button>
          </div>
        </form>
      )}

      {/* List of Simulation Items */}
      <div className="divide-y divide-slate-100">
        {simulations.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-700">
            Belum ada skenario simulasi. Klik "Tambah Skenario" untuk mencoba menghitung pengeluaran tidak terduga.
          </div>
        ) : (
          simulations.map(sim => {
            const targetProj = projections.find(p => p.monthYear === sim.monthYear);
            return (
              <div
                key={sim.id}
                className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  sim.isActive ? 'bg-amber-50/20' : 'opacity-60 bg-slate-50/40'
                }`}
              >
                {/* Left: Toggle + Info */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleSimulation(sim.id)}
                    className="text-slate-700 hover:text-amber-600 transition-colors shrink-0"
                    title={sim.isActive ? 'Nonaktifkan simulasi ini' : 'Aktifkan simulasi ini'}
                  >
                    {sim.isActive ? (
                      <ToggleRight className="w-7 h-7 text-amber-600" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-300" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold ${sim.isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                        {sim.name}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {formatMonthYearLabel(sim.monthYear)}
                      </span>
                      {sim.isActive ? (
                        <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          Aktif dihitung
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          Non-aktif
                        </span>
                      )}
                    </div>
                    {sim.notes && <p className="text-xs text-slate-700 mt-0.5">{sim.notes}</p>}
                  </div>
                </div>

                {/* Right: Nominal & Impact */}
                <div className="flex items-center justify-between sm:justify-end gap-4 pl-10 sm:pl-0">
                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-800 block">
                      -{formatRupiah(sim.amount)}
                    </span>
                    {targetProj && sim.isActive && (
                      <span className="text-[10px] text-slate-700 block">
                        Saldo bln itu: {formatRupiah(targetProj.endingBalance)}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Hapus simulasi "${sim.name}"?`)) {
                        onDeleteSimulation(sim.id);
                      }
                    }}
                    className="p-1.5 text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Hapus simulasi ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
