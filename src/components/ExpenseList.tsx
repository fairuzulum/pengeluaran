import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  CreditCard,
  Zap,
  Coffee,
  ShoppingBag,
  HelpCircle,
  Save,
  X,
  PieChart,
  FlagOff,
  Flag
} from 'lucide-react';
import { ExpenseItem, ExpenseCategory } from '../types';
import { formatRupiah, CATEGORY_META, monthDiff } from '../utils/formatters';

interface MonthOption {
  value: string;
  label: string;
}

interface ExpenseListProps {
  expenses: ExpenseItem[];
  currentMonthYear: string;
  monthOptions: MonthOption[];
  onAddExpense: (item: Omit<ExpenseItem, 'id'>) => void;
  onUpdateExpense: (id: string, updated: Partial<ExpenseItem>) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  currentMonthYear,
  monthOptions,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('cicilan');
  const [formDueDate, setFormDueDate] = useState('');
  const [formEndMonth, setFormEndMonth] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const isActiveThisMonth = (item: ExpenseItem) =>
    !item.endMonthYear || currentMonthYear <= item.endMonthYear;

  const activeExpenses = expenses.filter(isActiveThisMonth);

  const totalAmount = activeExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const paidCount = activeExpenses.filter(e => e.isPaidThisMonth).length;
  const paidAmount = activeExpenses
    .filter(e => e.isPaidThisMonth)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const remainingToPay = totalAmount - paidAmount;
  const paidPercentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  const filteredExpenses = selectedCategory === 'all'
    ? expenses
    : expenses.filter(e => e.category === selectedCategory);

  const startEdit = (item: ExpenseItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormAmount(item.amount.toString());
    setFormCategory(item.category);
    setFormDueDate(item.dueDateDay ? item.dueDateDay.toString() : '');
    setFormEndMonth(item.endMonthYear || '');
    setFormNotes(item.notes || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAddingNew(false);
    resetForm();
  };

  const resetForm = () => {
    setFormName('');
    setFormAmount('');
    setFormCategory('cicilan');
    setFormDueDate('');
    setFormEndMonth('');
    setFormNotes('');
  };

  const handleSaveEdit = (id: string) => {
    if (!formName.trim()) return;
    const amountNum = parseFloat(formAmount.replace(/\D/g, '')) || 0;
    const dueDayNum = formDueDate ? parseInt(formDueDate, 10) : undefined;

    onUpdateExpense(id, {
      name: formName.trim(),
      amount: amountNum,
      category: formCategory,
      dueDateDay: dueDayNum,
      endMonthYear: formEndMonth || undefined,
      notes: formNotes.trim()
    });
    setEditingId(null);
    resetForm();
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    const amountNum = parseFloat(formAmount.replace(/\D/g, '')) || 0;
    const dueDayNum = formDueDate ? parseInt(formDueDate, 10) : undefined;

    onAddExpense({
      name: formName.trim(),
      amount: amountNum,
      category: formCategory,
      dueDateDay: dueDayNum,
      endMonthYear: formEndMonth || undefined,
      notes: formNotes.trim(),
      isPaidThisMonth: false
    });
    setIsAddingNew(false);
    resetForm();
  };

  const getCategoryIcon = (category: ExpenseCategory) => {
    switch (category) {
      case 'cicilan':
        return <CreditCard className="w-4 h-4 text-rose-600" />;
      case 'utilitas':
        return <Zap className="w-4 h-4 text-amber-600" />;
      case 'kebutuhan':
        return <ShoppingBag className="w-4 h-4 text-sky-600" />;
      case 'pribadi':
        return <Coffee className="w-4 h-4 text-emerald-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div id="expense-details-container" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Rincian Pengeluaran Tetap Bulanan
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {expenses.length} Item
            </span>
          </div>
          <p className="text-xs text-slate-700 mt-0.5">
            Daftar kewajiban cicilan dan kebutuhan rutin bulanan yang harus dipenuhi
          </p>
        </div>

        {/* Action Button & Total */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-700 block">Total Pengeluaran</span>
            <span className="text-lg font-extrabold text-rose-700">{formatRupiah(totalAmount)}</span>
          </div>
          {!isAddingNew && (
            <button
              id="btn-add-expense-item"
              type="button"
              onClick={() => {
                resetForm();
                setIsAddingNew(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Payment Tracker Progress Banner */}
      <div className="bg-slate-50/80 px-4 sm:px-5 py-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Progress Pembayaran Bulan Ini:</span>
            <span className="text-slate-700 font-medium">
              {paidCount} dari {expenses.length} item ({paidPercentage}%)
            </span>
          </div>
          <div className="flex items-center gap-3 font-medium">
            <span className="text-emerald-700">Terbayar: {formatRupiah(paidAmount)}</span>
            <span className="text-slate-300">|</span>
            <span className="text-rose-700">Sisa Tagihan: {formatRupiah(remainingToPay)}</span>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${paidPercentage}%` }}
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="px-4 sm:px-5 py-2.5 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          Semua ({expenses.length})
        </button>
        {Object.entries(CATEGORY_META).map(([key, meta]) => {
          const count = expenses.filter(e => e.category === key).length;
          if (count === 0 && selectedCategory !== key) return null;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedCategory(key)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                selectedCategory === key
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {meta.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Add New Expense Form */}
      {isAddingNew && (
        <form onSubmit={handleSaveNew} className="p-4 sm:p-5 bg-indigo-50/50 border-b border-indigo-100 animate-in fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
              Tambah Pengeluaran Baru
            </h3>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-slate-700 hover:text-slate-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Item</label>
              <input
                type="text"
                required
                placeholder="Contoh: Cicilan KTA, Air PDAM"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
              <input
                type="text"
                required
                placeholder="Contoh: 1500000"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value as ExpenseCategory)}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="cicilan">Cicilan & Pinjaman</option>
                <option value="utilitas">Tagihan & Utilitas</option>
                <option value="kebutuhan">Kebutuhan Pokok</option>
                <option value="pribadi">Jajan & Pribadi</option>
                <option value="lainnya">Lain-lain</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jatuh Tempo (Tgl 1-31)</label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="Opsional, cth: 15"
                value={formDueDate}
                onChange={e => setFormDueDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Bulan Selesai
              </label>
              <select
                value={formEndMonth}
                onChange={e => setFormEndMonth(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Tidak ada / berlangsung terus</option>
                {monthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    Lunas {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-700 mt-1">
                Khusus cicilan: pilih bulan terakhir tagihan ini habis/lunas
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Simpan Item
            </button>
          </div>
        </form>
      )}

      {/* Expense Items List */}
      <div className="divide-y divide-slate-100">
        {filteredExpenses.map((item) => {
          const isEditing = editingId === item.id;
          const meta = CATEGORY_META[item.category] || CATEGORY_META.lainnya;
          const isFinished = Boolean(item.endMonthYear) && !isActiveThisMonth(item);

          if (isEditing) {
            return (
              <div key={item.id} className="p-4 bg-amber-50/50 border-l-4 border-amber-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Item</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border rounded-md bg-white border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
                    <input
                      type="text"
                      value={formAmount}
                      onChange={e => setFormAmount(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border rounded-md bg-white border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value as ExpenseCategory)}
                      className="w-full text-xs px-2.5 py-1.5 border rounded-md bg-white border-slate-300"
                    >
                      <option value="cicilan">Cicilan & Pinjaman</option>
                      <option value="utilitas">Tagihan & Utilitas</option>
                      <option value="kebutuhan">Kebutuhan Pokok</option>
                      <option value="pribadi">Jajan & Pribadi</option>
                      <option value="lainnya">Lain-lain</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Jatuh Tempo (Tgl)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formDueDate}
                      onChange={e => setFormDueDate(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border rounded-md bg-white border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Bulan Selesai</label>
                    <select
                      value={formEndMonth}
                      onChange={e => setFormEndMonth(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border rounded-md bg-white border-slate-300"
                    >
                      <option value="">Tidak ada / terus</option>
                      {monthOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          Lunas {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-1 text-xs text-slate-700 hover:bg-slate-200 rounded"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(item.id)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold rounded"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Perbarui</span>
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors ${
                isFinished ? 'bg-emerald-50/30 opacity-70' : item.isPaidThisMonth ? 'bg-slate-50/40 opacity-80' : ''
              }`}
            >
              {/* Left: Checkbox + Icon + Title + Tags */}
              <div className="flex items-center gap-3">
                {/* Pay status checkbox */}
                <button
                  type="button"
                  onClick={() => onUpdateExpense(item.id, { isPaidThisMonth: !item.isPaidThisMonth })}
                  className="text-slate-700 hover:text-emerald-600 transition-colors p-0.5 rounded"
                  title={item.isPaidThisMonth ? 'Tandai belum dibayar' : 'Tandai sudah lunas/dibayar'}
                >
                  {item.isPaidThisMonth ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                  )}
                </button>

                <div className="p-2 rounded-lg bg-slate-100 shrink-0">
                  {getCategoryIcon(item.category)}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm font-semibold ${
                        item.isPaidThisMonth ? 'line-through text-slate-700' : 'text-slate-900'
                      }`}
                    >
                      {item.name}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.color}`}>
                      {meta.label}
                    </span>
                    {item.dueDateDay && (
                      <span className="text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        Tgl {item.dueDateDay}
                      </span>
                    )}
                    {item.endMonthYear && (() => {
                      const monthOpt = monthOptions.find(o => o.value === item.endMonthYear);
                      const label = monthOpt ? monthOpt.label : item.endMonthYear;
                      const remaining = monthDiff(currentMonthYear, item.endMonthYear);
                      return (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            isFinished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {isFinished ? (
                            <>
                              <FlagOff className="w-3 h-3" />
                              Selesai {label}
                            </>
                          ) : (
                            <>
                              <Flag className="w-3 h-3" />
                              Lunas {label}
                              {remaining === 0 ? ' (bulan ini!)' : ` (${remaining} bln lagi)`}
                            </>
                          )}
                        </span>
                      );
                    })()}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-slate-700 mt-0.5">{item.notes}</p>
                  )}
                </div>
              </div>

              {/* Right: Amount & Action Buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-3.5 pl-11 sm:pl-0">
                <div className="text-right">
                  <span
                    className={`text-base font-bold ${
                      item.isPaidThisMonth ? 'text-slate-700' : 'text-rose-700'
                    }`}
                  >
                    {formatRupiah(item.amount)}
                  </span>
                  <span className="block text-[10px] text-slate-700">
                    {item.isPaidThisMonth ? 'Lunas Bulan Ini' : 'Per Bulan'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="p-1.5 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                    title="Ubah item pengeluaran"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Hapus pengeluaran "${item.name}"?`)) {
                        onDeleteExpense(item.id);
                      }
                    }}
                    className="p-1.5 text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Hapus item pengeluaran"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};