import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { FinancialData, MonthProjection } from '../types';
import { formatRupiah } from '../utils/formatters';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.setCustomParameters({ prompt: 'select_account' });

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token might need re-prompting or can be fetched if still in memory
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan access token Google Sheets.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const signOutGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getCachedToken = (): string | null => cachedAccessToken;

/**
 * Creates and exports financial data directly into a new Google Spreadsheet
 */
export async function exportFinancialDataToGoogleSheets(
  token: string,
  data: FinancialData,
  projections: MonthProjection[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const currentDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const sheetTitle = `Pengeluaran Gua - Laporan Keuangan (${currentDateStr})`;

  // Step 1: Create Spreadsheet
  const createResp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: sheetTitle
      },
      sheets: [
        {
          properties: {
            title: 'Ringkasan & Proyeksi',
            gridProperties: { rowCount: 50, columnCount: 10 }
          }
        },
        {
          properties: {
            title: 'Rincian Pengeluaran Tetap',
            gridProperties: { rowCount: 40, columnCount: 8 }
          }
        },
        {
          properties: {
            title: 'Pemasukan & Simulasi',
            gridProperties: { rowCount: 30, columnCount: 8 }
          }
        }
      ]
    })
  });

  if (!createResp.ok) {
    const errText = await createResp.text();
    throw new Error(`Gagal membuat Google Spreadsheet: ${createResp.statusText} (${errText})`);
  }

  const createData = await createResp.json();
  const spreadsheetId = createData.spreadsheetId;
  const spreadsheetUrl = createData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Step 2: Prepare sheet values
  // Sheet 1: Ringkasan & Proyeksi
  const totalFixedExpense = data.expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const monthlyCashflow = data.monthlySalary - totalFixedExpense;

  const projectionRows: (string | number)[][] = [
    ['PENGELUARAN GUA - DASHBOARD & PROYEKSI SALDO'],
    ['Tanggal Export', currentDateStr],
    ['Gaji Rutin Bulanan', data.monthlySalary],
    ['Total Pengeluaran Tetap', totalFixedExpense],
    ['Arus Kas Bersih (Net Cashflow Bulanan)', monthlyCashflow],
    ['Status Bulanan', monthlyCashflow < 0 ? 'DEFISIT (Pengeluaran > Gaji)' : 'SURPLUS'],
    ['Saldo Awal Tabungan (Saat Ini)', data.startingBalance],
    [''],
    ['PROYEKSI SALDO BULAN KE DEPAN'],
    [
      'Bulan',
      'Saldo Awal',
      'Gaji Rutin',
      'Pemasukan Khusus',
      'Total Pemasukan',
      'Pengeluaran Tetap',
      'Simulasi Ekstra',
      'Total Pengeluaran',
      'Net Cashflow',
      'Saldo Akhir',
      'Status Saldo'
    ]
  ];

  projections.forEach(p => {
    projectionRows.push([
      p.fullMonthLabel,
      p.startingBalance,
      p.regularIncome,
      p.specialIncome,
      p.totalIncome,
      p.regularExpense,
      p.simulatedExpense,
      p.totalExpense,
      p.netCashflow,
      p.endingBalance,
      p.endingBalance < 0 ? 'KRITIS / MINUS' : p.endingBalance < 2000000 ? 'WASPADA' : 'AMAN'
    ]);
  });

  // Sheet 2: Rincian Pengeluaran Tetap
  const expenseRows: (string | number)[][] = [
    ['RINCIAN PENGELUARAN TETAP BULANAN'],
    ['Total Pengeluaran Bulanan', totalFixedExpense],
    [''],
    ['No', 'Nama Pengeluaran', 'Kategori', 'Nominal (Rp)', 'Status Bayar', 'Catatan']
  ];

  data.expenses.forEach((item, idx) => {
    expenseRows.push([
      idx + 1,
      item.name,
      item.category.toUpperCase(),
      item.amount,
      item.isPaidThisMonth ? 'LUNAS' : 'BELUM BAYAR',
      item.notes || '-'
    ]);
  });
  expenseRows.push(['', 'TOTAL', '', totalFixedExpense, '', '']);

  // Sheet 3: Pemasukan & Simulasi
  const simulationRows: (string | number)[][] = [
    ['PEMASUKAN KHUSUS / SEKALI WAKTU'],
    ['No', 'Nama Pemasukan', 'Bulan Cair', 'Nominal (Rp)', 'Keterangan']
  ];

  data.specialIncomes.forEach((inc, idx) => {
    simulationRows.push([
      idx + 1,
      inc.name,
      inc.monthYear,
      inc.amount,
      inc.notes || '-'
    ]);
  });

  simulationRows.push(['']);
  simulationRows.push(['SKENARIO SIMULASI WHAT-IF (PENGELUARAN MENDADAK)']);
  simulationRows.push(['No', 'Nama Skenario', 'Bulan Terjadi', 'Nominal (Rp)', 'Status Aktif', 'Keterangan']);

  data.simulations.forEach((sim, idx) => {
    simulationRows.push([
      idx + 1,
      sim.name,
      sim.monthYear,
      sim.amount,
      sim.isActive ? 'AKTIF DIHITUNG' : 'NON-AKTIF',
      sim.notes || '-'
    ]);
  });

  // Step 3: Write batch values
  const writeResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: "'Ringkasan & Proyeksi'!A1",
            values: projectionRows
          },
          {
            range: "'Rincian Pengeluaran Tetap'!A1",
            values: expenseRows
          },
          {
            range: "'Pemasukan & Simulasi'!A1",
            values: simulationRows
          }
        ]
      })
    }
  );

  if (!writeResp.ok) {
    const errText = await writeResp.text();
    throw new Error(`Gagal menulis data ke Google Sheets: ${writeResp.statusText} (${errText})`);
  }

  return { spreadsheetId, spreadsheetUrl };
}
