import React, { useState } from 'react';
import {
  Gift,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Edit2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { SpecialIncome } from '../types';
import { formatRupiah, formatMonthYearLabel } from '../utils/formatters';

interface SpecialIncomeManagerProps {
  specialIncomes: SpecialIncome[];
  projectionMonthOptions: { value: string; label: string }[];
  onAddSpecialIncome: (income: Omit<SpecialIncome, 'id'>) => void;
  onDeleteSpecialIncome: (id: string) => void;
}

export const SpecialIncomeManager: React.FC<SpecialIncomeManagerProps> = ({
  specialIncomes,
  projectionMonthOptions,
  onAddSpecialIncome,
  onDeleteSpecialIncome
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [monthYear, setMonthYear] = useState('2026-12'); // Default to December
  const [notes, setNotes] = useState('');

  const totalSpecialIncome = specialIncomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const numAmount = parseFloat(amount.replace(/\D/g, '')) || 0;
    if (numAmount <= 0) return;

    onAddSpecialIncome({
      name: name.trim(),
      amount: numAmount,
      monthYear,
      notes: notes.trim()
    });

    setName('');
    setAmount('');
    setNotes('');
    setIsAdding(false);
  };

  return (
    <div id="special-income-container" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-emerald-100 text-emerald-800">
              <Gift className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Pemasukan Tambahan Khusus (Sekali Waktu)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {specialIncomes.length} Item
            </span>
          </div>
          <p className="text-xs text-slate-700 mt-0.5">
            Pemasukan insidental (seperti Kompensasi Kontrak, THR, atau Bonus) yang cair di bulan spesifik
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-700 block">Total Ekstra</span>
            <span className="text-base font-extrabold text-emerald-700">
              {formatRupiah(totalSpecialIncome)}
            </span>
          </div>
          <button
            id="btn-add-special-income"
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pemasukan</span>
          </button>
        </div>
      </div>

      {/* Form Add New Special Income */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 bg-emerald-50/40 border-b border-emerald-200 animate-in fade-in">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-3">
            Tambah Pemasukan Tambahan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pemasukan
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Kompensasi Kontrak, THR, Bonus Project"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal (Rp)
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 5500000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bulan Cair
              </label>
              <select
                value={monthYear}
                onChange={e => setMonthYear(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
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
              className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
            >
              Simpan Pemasukan
            </button>
          </div>
        </form>
      )}

      {/* List of Special Incomes */}
      <div className="divide-y divide-slate-100">
        {specialIncomes.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-700">
            Belum ada data pemasukan tambahan khusus.
          </div>
        ) : (
          specialIncomes.map(inc => (
            <div
              key={inc.id}
              className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-emerald-50/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900">{inc.name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Cair: {formatMonthYearLabel(inc.monthYear)}
                    </span>
                  </div>
                  {inc.notes && <p className="text-xs text-slate-700 mt-0.5">{inc.notes}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pl-11 sm:pl-0">
                <div className="text-right">
                  <span className="text-base font-bold text-emerald-700 block">
                    +{formatRupiah(inc.amount)}
                  </span>
                  <span className="text-[10px] text-slate-700 block">Hanya bulan tersebut</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Hapus pemasukan "${inc.name}"?`)) {
                      onDeleteSpecialIncome(inc.id);
                    }
                  }}
                  className="p-1.5 text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title="Hapus item pemasukan khusus ini"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
