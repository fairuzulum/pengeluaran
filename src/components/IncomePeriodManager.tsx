import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Wallet,
  CalendarDays,
} from 'lucide-react';

import { IncomePeriod } from '../types';
import { formatRupiah, formatMonthYearLabel } from '../utils/formatters';

interface MonthOption {
  value: string;
  label: string;
}

interface IncomePeriodManagerProps {
  incomePeriods: IncomePeriod[];

  projectionMonthOptions: MonthOption[];

  onAddIncomePeriod: (
    income: Omit<IncomePeriod, 'id'>
  ) => void;

  onUpdateIncomePeriod: (
    id: string,
    updated: Partial<IncomePeriod>
  ) => void;

  onDeleteIncomePeriod: (
    id: string
  ) => void;
}

export const IncomePeriodManager: React.FC<
  IncomePeriodManagerProps
> = ({
  incomePeriods,
  projectionMonthOptions,
  onAddIncomePeriod,
  onUpdateIncomePeriod,
  onDeleteIncomePeriod,
}) => {
  const currentMonthYear = new Date()
    .toISOString()
    .slice(0, 7);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formStartMonth, setFormStartMonth] =
    useState(currentMonthYear);
  const [formEndMonth, setFormEndMonth] =
    useState('');
  const [formNotes, setFormNotes] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormAmount('');
    setFormStartMonth(currentMonthYear);
    setFormEndMonth('');
    setFormNotes('');
    setEditingId(null);
    setIsAdding(false);
  };

  const startAdd = () => {
    resetForm();
    setFormStartMonth(currentMonthYear);
    setIsAdding(true);
  };

  const startEdit = (income: IncomePeriod) => {
    setEditingId(income.id);
    setIsAdding(false);

    setFormName(income.name);
    setFormAmount(String(income.amount));
    setFormStartMonth(income.startMonth);
    setFormEndMonth(income.endMonth || '');
    setFormNotes(income.notes || '');
  };

  const handleSave = () => {
    const name = formName.trim();
    const amount = Number(formAmount);

    if (!name) {
      alert('Nama pemasukan wajib diisi.');
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      alert('Nominal pemasukan tidak valid.');
      return;
    }

    if (!formStartMonth) {
      alert('Bulan mulai wajib dipilih.');
      return;
    }

    if (
      formEndMonth &&
      formEndMonth < formStartMonth
    ) {
      alert(
        'Bulan selesai tidak boleh lebih awal dari bulan mulai.'
      );
      return;
    }

    const payload: Omit<IncomePeriod, 'id'> = {
      name,
      amount,
      startMonth: formStartMonth,
      endMonth: formEndMonth || undefined,
      notes: formNotes.trim() || undefined,
    };

    if (editingId) {
      onUpdateIncomePeriod(
        editingId,
        payload
      );
    } else {
      onAddIncomePeriod(payload);
    }

    resetForm();
  };

  const handleDelete = (income: IncomePeriod) => {
    const confirmed = window.confirm(
      `Hapus pemasukan "${income.name}"?`
    );

    if (!confirmed) return;

    onDeleteIncomePeriod(income.id);

    if (editingId === income.id) {
      resetForm();
    }
  };

  const getMonthLabel = (monthYear?: string) => {
    if (!monthYear) return '';

    const option =
      projectionMonthOptions.find(
        (item) => item.value === monthYear
      );

    if (option) return option.label;

    return formatMonthYearLabel(monthYear);
  };

  const isActiveThisMonth = (income: IncomePeriod) => {
    const started =
      currentMonthYear >= income.startMonth;

    const notEnded =
      !income.endMonth ||
      currentMonthYear <= income.endMonth;

    return started && notEnded;
  };

  const sortedIncomePeriods = [...incomePeriods].sort(
    (a, b) => {
      if (a.startMonth !== b.startMonth) {
        return b.startMonth.localeCompare(
          a.startMonth
        );
      }

      return a.name.localeCompare(b.name);
    }
  );

  const activeIncome = incomePeriods.filter(
    isActiveThisMonth
  );

  const totalCurrentIncome = activeIncome.reduce(
    (sum, income) =>
      sum + (Number(income.amount) || 0),
    0
  );

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <Wallet className="w-5 h-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Pemasukan Rutin
            </h2>

            <p className="text-xs text-slate-500 mt-0.5">
              Atur gaji/pemasukan berdasarkan periode
              waktu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right mr-2">
            <span className="block text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
              Aktif Bulan Ini
            </span>

            <span className="block text-sm font-bold text-emerald-600">
              {formatRupiah(totalCurrentIncome)}
            </span>
          </div>

          <button
            type="button"
            onClick={startAdd}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* FORM */}
      {(isAdding || editingId) && (
        <div className="p-5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {editingId
                  ? 'Ubah Pemasukan'
                  : 'Tambah Pemasukan'}
              </h3>

              <p className="text-xs text-slate-500 mt-0.5">
                Perubahan akan disimpan ke PostgreSQL.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
              title="Batal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NAMA */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Pemasukan
              </label>

              <input
                type="text"
                value={formName}
                onChange={(event) =>
                  setFormName(event.target.value)
                }
                placeholder="Contoh: Gaji PT ABC"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* NOMINAL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nominal per Bulan
              </label>

              <input
                type="number"
                min="0"
                step="1000"
                value={formAmount}
                onChange={(event) =>
                  setFormAmount(event.target.value)
                }
                placeholder="Contoh: 5000000"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* START */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mulai
              </label>

              <select
                value={formStartMonth}
                onChange={(event) =>
                  setFormStartMonth(
                    event.target.value
                  )
                }
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {projectionMonthOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* END */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Berakhir
                <span className="font-normal text-slate-400">
                  {' '}
                  (opsional)
                </span>
              </label>

              <select
                value={formEndMonth}
                onChange={(event) =>
                  setFormEndMonth(
                    event.target.value
                  )
                }
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">
                  Tidak ada tanggal selesai
                </option>

                {projectionMonthOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      disabled={
                        option.value <
                        formStartMonth
                      }
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* NOTES */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Catatan
                <span className="font-normal text-slate-400">
                  {' '}
                  (opsional)
                </span>
              </label>

              <textarea
                value={formNotes}
                onChange={(event) =>
                  setFormNotes(event.target.value)
                }
                placeholder="Contoh: Kontrak kerja sampai Desember 2028"
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm outline-none resize-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* ACTION */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Batal
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />

              {editingId
                ? 'Simpan Perubahan'
                : 'Simpan Pemasukan'}
            </button>
          </div>
        </div>
      )}

      {/* LIST */}
      <div className="p-5">
        {sortedIncomePeriods.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Wallet className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-semibold text-slate-700">
              Belum ada pemasukan rutin
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Tambahkan gaji atau pemasukan bulanan
              untuk mulai membuat proyeksi.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedIncomePeriods.map((income) => {
              const active =
                isActiveThisMonth(income);

              return (
                <div
                  key={income.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    active
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* INFO */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          active
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Wallet className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            {income.name}
                          </h3>

                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {active
                              ? 'Aktif'
                              : 'Tidak Aktif'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <CalendarDays className="w-3.5 h-3.5" />

                            {getMonthLabel(
                              income.startMonth
                            )}

                            {' → '}

                            {income.endMonth
                              ? getMonthLabel(
                                  income.endMonth
                                )
                              : 'seterusnya'}
                          </span>
                        </div>

                        {income.notes && (
                          <p className="text-xs text-slate-500 mt-1">
                            {income.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* AMOUNT + ACTION */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 pl-11 sm:pl-0">
                      <div className="text-right">
                        <span
                          className={`block text-base font-bold ${
                            active
                              ? 'text-emerald-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {formatRupiah(
                            Number(income.amount) || 0
                          )}
                        </span>

                        <span className="block text-[10px] text-slate-400">
                          per bulan
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            startEdit(income)
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-white transition-colors"
                          title="Ubah pemasukan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(income)
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus pemasukan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER INFO */}
      {incomePeriods.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-[11px] text-slate-400">
            Pemasukan yang aktif pada suatu bulan akan
            otomatis masuk ke perhitungan proyeksi bulan
            tersebut.
          </p>
        </div>
      )}
    </section>
  );
};