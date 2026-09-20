
import {
  initializeApp,
  getApps,
  getApp
} from 'firebase/app';

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';

import firebaseConfig from '../../firebase-applet-config.json';

import {
  FinancialData,
  MonthProjection
} from '../types';

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();

export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

provider.addScope(
  'https://www.googleapis.com/auth/spreadsheets'
);

provider.setCustomParameters({
  prompt: 'select_account'
});

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initGoogleAuth = (
  onAuthSuccess?: (
    user: User,
    token: string
  ) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(
    auth,
    async (user: User | null) => {
      if (user) {
        if (cachedAccessToken) {
          if (onAuthSuccess) {
            onAuthSuccess(
              user,
              cachedAccessToken
            );
          }
        } else if (!isSigningIn) {
          /*
           * Token might need re-prompting
           * or can be fetched if still in memory.
           */
          if (onAuthFailure) {
            onAuthFailure();
          }
        }
      } else {
        cachedAccessToken = null;

        if (onAuthFailure) {
          onAuthFailure();
        }
      }
    }
  );
};

export const signInWithGoogle = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;

    const result =
      await signInWithPopup(auth, provider);

    const credential =
      GoogleAuthProvider.credentialFromResult(
        result
      );

    if (!credential?.accessToken) {
      throw new Error(
        'Gagal mendapatkan access token Google Sheets.'
      );
    }

    cachedAccessToken =
      credential.accessToken;

    return {
      user: result.user,
      accessToken: cachedAccessToken
    };
  } finally {
    isSigningIn = false;
  }
};

export const signOutGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getCachedToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Mengecek apakah income aktif pada bulan tertentu.
 */
function isIncomeActiveInMonth(
  startMonth: string,
  endMonth: string | undefined,
  monthYear: string
): boolean {
  if (monthYear < startMonth) {
    return false;
  }

  if (!endMonth) {
    return true;
  }

  return monthYear <= endMonth;
}

/**
 * Mengecek apakah expense aktif pada bulan tertentu.
 */
function isExpenseActiveInMonth(
  startMonthYear: string,
  endMonthYear: string | undefined,
  monthYear: string
): boolean {
  if (monthYear < startMonthYear) {
    return false;
  }

  if (!endMonthYear) {
    return true;
  }

  return monthYear <= endMonthYear;
}

/**
 * Creates and exports financial data
 * directly into a new Google Spreadsheet.
 */
export async function exportFinancialDataToGoogleSheets(
  token: string,
  data: FinancialData,
  projections: MonthProjection[]
): Promise<{
  spreadsheetId: string;
  spreadsheetUrl: string;
}> {
  const currentDateStr =
    new Date().toLocaleDateString(
      'id-ID',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    );

  const currentMonthYear =
    new Date()
      .toISOString()
      .slice(0, 7);

  const sheetTitle =
    `Pengeluaran Gua - Laporan Keuangan (${currentDateStr})`;

  /*
   * ============================================================
   * STEP 1
   * CREATE SPREADSHEET
   * ============================================================
   */

  const createResp = await fetch(
    'https://sheets.googleapis.com/v4/spreadsheets',
    {
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

              gridProperties: {
                rowCount: 100,
                columnCount: 12
              }
            }
          },

          {
            properties: {
              title: 'Rincian Pengeluaran Tetap',

              gridProperties: {
                rowCount: 100,
                columnCount: 10
              }
            }
          },

          {
            properties: {
              title: 'Pemasukan & Simulasi',

              gridProperties: {
                rowCount: 100,
                columnCount: 10
              }
            }
          }
        ]
      })
    }
  );

  if (!createResp.ok) {
    const errText =
      await createResp.text();

    throw new Error(
      `Gagal membuat Google Spreadsheet: ${createResp.statusText} (${errText})`
    );
  }

  const createData =
    await createResp.json();

  const spreadsheetId =
    createData.spreadsheetId;

  const spreadsheetUrl =
    createData.spreadsheetUrl ||
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  /*
   * ============================================================
   * STEP 2
   * PREPARE DATA
   * ============================================================
   */

  /*
   * ------------------------------------------------------------
   * CURRENT MONTH INCOME
   * ------------------------------------------------------------
   */

  const currentMonthIncome =
    data.incomePeriods
      .filter((income) =>
        isIncomeActiveInMonth(
          income.startMonth,
          income.endMonth,
          currentMonthYear
        )
      )
      .reduce(
        (sum, income) =>
          sum +
          (Number(income.amount) || 0),
        0
      );

  /*
   * ------------------------------------------------------------
   * CURRENT MONTH EXPENSE
   * ------------------------------------------------------------
   */

  const activeExpenses =
    data.expenses.filter((expense) =>
      isExpenseActiveInMonth(
        expense.startMonthYear,
        expense.endMonthYear,
        currentMonthYear
      )
    );

  const totalFixedExpense =
    activeExpenses.reduce(
      (sum, expense) =>
        sum +
        (Number(expense.amount) || 0),
      0
    );

  const monthlyCashflow =
    currentMonthIncome -
    totalFixedExpense;

  /*
   * ============================================================
   * SHEET 1
   * RINGKASAN & PROYEKSI
   * ============================================================
   */

  const projectionRows:
    (string | number)[][] = [
      [
        'PENGELUARAN GUA - DASHBOARD & PROYEKSI SALDO'
      ],

      [
        'Tanggal Export',
        currentDateStr
      ],

      [
        'Pemasukan Rutin Bulan Ini',
        currentMonthIncome
      ],

      [
        'Total Pengeluaran Tetap Bulan Ini',
        totalFixedExpense
      ],

      [
        'Arus Kas Bersih Bulan Ini',
        monthlyCashflow
      ],

      [
        'Status Bulanan',
        monthlyCashflow < 0
          ? 'DEFISIT (Pengeluaran > Pemasukan)'
          : 'SURPLUS'
      ],

      [
        'Saldo Saat Ini',
        data.currentBalance
      ],

      [
        ''
      ],

      [
        'PROYEKSI SALDO BULAN KE DEPAN'
      ],

      [
        'Bulan',
        'Saldo Awal',
        'Pemasukan Rutin',
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

  projections.forEach((projection) => {
    projectionRows.push([
      projection.fullMonthLabel,

      projection.startingBalance,

      projection.regularIncome,

      projection.specialIncome,

      projection.totalIncome,

      projection.regularExpense,

      projection.simulatedExpense,

      projection.totalExpense,

      projection.netCashflow,

      projection.endingBalance,

      projection.endingBalance < 0
        ? 'KRITIS / MINUS'
        : projection.endingBalance < 2000000
        ? 'WASPADA'
        : 'AMAN'
    ]);
  });

  /*
   * ============================================================
   * SHEET 2
   * RINCIAN PENGELUARAN TETAP
   * ============================================================
   */

  const expenseRows:
    (string | number)[][] = [
      [
        'RINCIAN PENGELUARAN TETAP'
      ],

      [
        'Total Pengeluaran Aktif Bulan Ini',
        totalFixedExpense
      ],

      [
        ''
      ],

      [
        'No',
        'Nama Pengeluaran',
        'Kategori',
        'Nominal (Rp)',
        'Mulai',
        'Selesai',
        'Status Bulan Ini',
        'Status Bayar',
        'Jatuh Tempo',
        'Catatan'
      ]
    ];

  /*
   * Kita export SEMUA expense,
   * termasuk expense yang sudah selesai,
   * supaya data historis tetap terlihat.
   */

  data.expenses.forEach(
    (item, idx) => {
      const isActive =
        isExpenseActiveInMonth(
          item.startMonthYear,
          item.endMonthYear,
          currentMonthYear
        );

      expenseRows.push([
        idx + 1,

        item.name,

        item.category.toUpperCase(),

        Number(item.amount) || 0,

        item.startMonthYear,

        item.endMonthYear ||
          'Berlangsung terus',

        isActive
          ? 'AKTIF'
          : 'TIDAK AKTIF',

        isActive
          ? item.isPaidThisMonth
            ? 'LUNAS'
            : 'BELUM BAYAR'
          : '-',

        item.dueDateDay
          ? item.dueDateDay
          : '-',

        item.notes || '-'
      ]);
    }
  );

  expenseRows.push([
    '',
    'TOTAL PENGELUARAN AKTIF BULAN INI',
    '',
    totalFixedExpense,
    '',
    '',
    '',
    '',
    '',
    ''
  ]);

  /*
   * ============================================================
   * SHEET 3
   * PEMASUKAN & SIMULASI
   * ============================================================
   */

  const simulationRows:
    (string | number)[][] = [];

  /*
   * ------------------------------------------------------------
   * PEMASUKAN RUTIN
   * ------------------------------------------------------------
   */

  simulationRows.push([
    'PEMASUKAN RUTIN / PERIODE'
  ]);

  simulationRows.push([
    'No',
    'Nama Pemasukan',
    'Nominal (Rp)',
    'Mulai',
    'Selesai',
    'Status Bulan Ini',
    'Catatan'
  ]);

  data.incomePeriods.forEach(
    (income, idx) => {
      const isActive =
        isIncomeActiveInMonth(
          income.startMonth,
          income.endMonth,
          currentMonthYear
        );

      simulationRows.push([
        idx + 1,

        income.name,

        Number(income.amount) || 0,

        income.startMonth,

        income.endMonth ||
          'Berlangsung terus',

        isActive
          ? 'AKTIF'
          : 'TIDAK AKTIF',

        income.notes || '-'
      ]);
    }
  );

  /*
   * ------------------------------------------------------------
   * PEMASUKAN KHUSUS
   * ------------------------------------------------------------
   */

  simulationRows.push([
    ''
  ]);

  simulationRows.push([
    'PEMASUKAN KHUSUS / SEKALI WAKTU'
  ]);

  simulationRows.push([
    'No',
    'Nama Pemasukan',
    'Bulan Cair',
    'Nominal (Rp)',
    'Keterangan'
  ]);

  data.specialIncomes.forEach(
    (income, idx) => {
      simulationRows.push([
        idx + 1,

        income.name,

        income.monthYear,

        Number(income.amount) || 0,

        income.notes || '-'
      ]);
    }
  );

  /*
   * ------------------------------------------------------------
   * SIMULASI WHAT-IF
   * ------------------------------------------------------------
   */

  simulationRows.push([
    ''
  ]);

  simulationRows.push([
    'SKENARIO SIMULASI WHAT-IF (PENGELUARAN MENDADAK)'
  ]);

  simulationRows.push([
    'No',
    'Nama Skenario',
    'Bulan Terjadi',
    'Nominal (Rp)',
    'Status Aktif',
    'Keterangan'
  ]);

  data.simulations.forEach(
    (simulation, idx) => {
      simulationRows.push([
        idx + 1,

        simulation.name,

        simulation.monthYear,

        Number(simulation.amount) || 0,

        simulation.isActive
          ? 'AKTIF DIHITUNG'
          : 'NON-AKTIF',

        simulation.notes || '-'
      ]);
    }
  );

  /*
   * ============================================================
   * STEP 3
   * WRITE ALL DATA
   * ============================================================
   */

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
            range:
              "'Ringkasan & Proyeksi'!A1",

            values: projectionRows
          },

          {
            range:
              "'Rincian Pengeluaran Tetap'!A1",

            values: expenseRows
          },

          {
            range:
              "'Pemasukan & Simulasi'!A1",

            values: simulationRows
          }
        ]
      })
    }
  );

  if (!writeResp.ok) {
    const errText =
      await writeResp.text();

    throw new Error(
      `Gagal menulis data ke Google Sheets: ${writeResp.statusText} (${errText})`
    );
  }

  return {
    spreadsheetId,
    spreadsheetUrl
  };
}

