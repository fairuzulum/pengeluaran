import React, { useState } from 'react';
import {
  FileSpreadsheet,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  UploadCloud,
  Check,
  ShieldCheck
} from 'lucide-react';
import { User } from 'firebase/auth';
import { FinancialData, MonthProjection } from '../types';
import {
  signInWithGoogle,
  signOutGoogle,
  exportFinancialDataToGoogleSheets
} from '../services/googleSheets';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  cachedToken: string | null;
  onAuthSuccess: (user: User, token: string) => void;
  onAuthLogout: () => void;
  financialData: FinancialData;
  projections: MonthProjection[];
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  cachedToken,
  onAuthSuccess,
  onAuthLogout,
  financialData,
  projections
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportedSheet, setExportedSheet] = useState<{
    id: string;
    url: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setExportError(null);
    try {
      const res = await signInWithGoogle();
      if (res) {
        onAuthSuccess(res.user, res.accessToken);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setExportError(err.message || 'Gagal masuk dengan akun Google.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutGoogle();
      onAuthLogout();
      setExportedSheet(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  const handleExport = async () => {
    if (!cachedToken) {
      setExportError('Silakan masuk dengan akun Google terlebih dahulu.');
      return;
    }
    setIsExporting(true);
    setExportError(null);
    try {
      const result = await exportFinancialDataToGoogleSheets(
        cachedToken,
        financialData,
        projections
      );
      setExportedSheet({
        id: result.spreadsheetId,
        url: result.spreadsheetUrl
      });
    } catch (err: any) {
      console.error('Export error:', err);
      setExportError(err.message || 'Terjadi kesalahan saat mengekspor ke Google Sheets.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Sinkronisasi Google Sheets</h3>
              <p className="text-xs text-slate-700">Ekspor rincian dan proyeksi keuangan ke spreadsheet Anda</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-700 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* User Account State */}
          {currentUser && cachedToken ? (
            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-emerald-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-sm">
                    {currentUser.email ? currentUser.email[0].toUpperCase() : 'G'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">
                      {currentUser.displayName || 'Akun Google Terhubung'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-xs text-slate-700">{currentUser.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="p-1.5 text-xs text-slate-700 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                title="Putuskan sambungan Google"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-center py-4 px-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-700 mb-3 leading-relaxed">
                Hubungkan akun Google Anda untuk membuat dan mengekspor spreadsheet laporan proyeksi keuangan pribadi langsung ke Google Drive Anda.
              </p>

              {/* Official Google Sign-In Styled Button */}
              <button
                id="btn-google-signin"
                type="button"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="inline-flex items-center justify-center gap-3 px-5 py-2.5 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-xs shadow-xs transition-all disabled:opacity-60"
              >
                {isSigningIn ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                )}
                <span>{isSigningIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}

          {/* Export Details info */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
            <span className="font-semibold text-slate-800 block">Isi Dokumen Spreadsheet yang Dihasilkan:</span>
            <ul className="space-y-1 text-slate-700 list-disc list-inside">
              <li>Sheet 1: <strong>Ringkasan & Proyeksi Bulanan</strong> (Saldo Awal, Pemasukan, Pengeluaran, Saldo Akhir)</li>
              <li>Sheet 2: <strong>Rincian Pengeluaran Tetap</strong> ({financialData.expenses.length} item pengeluaran & cicilan)</li>
              <li>Sheet 3: <strong>Pemasukan Khusus & Skenario Simulasi</strong></li>
            </ul>
          </div>

          {/* Error Message if any */}
          {exportError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{exportError}</span>
            </div>
          )}

          {/* Success Banner if exported */}
          {exportedSheet && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Berhasil Diekspor ke Google Sheets!</span>
              </div>
              <p className="text-emerald-950/90">
                File spreadsheet baru telah dibuat di Google Drive Anda.
              </p>
              <a
                href={exportedSheet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
              >
                <span>Buka Dokumen di Google Sheets</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-700">Aman & tersimpan di akun Google Anda</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Tutup
            </button>
            {currentUser && cachedToken && (
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengekspor...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Ekspor ke Sheets</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
