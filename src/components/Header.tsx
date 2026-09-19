import React from 'react';
import { Wallet, RefreshCw, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface HeaderProps {
  startingBalance: number;
  totalExpense: number;
  monthlySalary: number;
  onResetData: () => void;
  onOpenGoogleSheetsModal: () => void;
  hasActiveGoogleAuth: boolean;
  userEmail?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  onResetData,
  onOpenGoogleSheetsModal,
  hasActiveGoogleAuth,
  userEmail
}) => {
  return (
    <header id="app-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pengeluaran Gua</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Sep 2026
                </span>
              </div>
              <p className="text-xs text-slate-700">
                Pengingat rincian keuangan bulanan & proyeksi saldo tabungan pribadi
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Google Sheets Sync Button */}
            <button
              id="btn-google-sheets-modal"
              type="button"
              onClick={onOpenGoogleSheetsModal}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                hasActiveGoogleAuth
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Ekspor ke Google Sheets"
            >
              <FileSpreadsheet className={`w-4 h-4 ${hasActiveGoogleAuth ? 'text-emerald-600' : 'text-emerald-600'}`} />
              <span>{hasActiveGoogleAuth ? (userEmail ? `Sheets: ${userEmail.split('@')[0]}` : 'Sheets Terhubung') : 'Google Sheets'}</span>
            </button>

            {/* Reset to Default Button */}
            <button
              id="btn-reset-default-data"
              type="button"
              onClick={() => {
                if (window.confirm('Kembalikan semua data ke setelan awal default (Gaji Rp 5.5jt, Saldo Rp 10.3jt, cicilan lengkap)?')) {
                  onResetData();
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
              title="Kembalikan data ke angka asli default"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Default</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
