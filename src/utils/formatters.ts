export const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

export const MONTH_NAMES_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agt',
  'Sep',
  'Okt',
  'Nov',
  'Des'
];

/**
 * Format number to Indonesian Rupiah (Rp)
 * Example: 10300000 -> "Rp 10.300.000"
 */
export function formatRupiah(amount: number, includeSign: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }

  const isNegative = amount < 0;
  const absVal = Math.abs(Math.round(amount));
  const formatted = absVal.toLocaleString('id-ID');

  if (isNegative) {
    return `-Rp ${formatted}`;
  }
  if (includeSign && amount > 0) {
    return `+Rp ${formatted}`;
  }
  return `Rp ${formatted}`;
}

/**
 * Format number with compact format for charts/dense views if needed
 */
export function formatCompactRupiah(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  if (abs >= 1_000_000_000) {
    return `${isNegative ? '-' : ''}Rp ${(abs / 1_000_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000_000) {
    return `${isNegative ? '-' : ''}Rp ${(abs / 1_000_000).toFixed(1)}jt`;
  }
  if (abs >= 1_000) {
    return `${isNegative ? '-' : ''}Rp ${(abs / 1_000).toFixed(0)}rb`;
  }
  return formatRupiah(amount);
}

/**
 * Convert monthYear string ('2026-09') to label e.g. "September 2026"
 */
export function formatMonthYearLabel(monthYear: string): string {
  if (!monthYear || !monthYear.includes('-')) return monthYear;
  const [yearStr, monthStr] = monthYear.split('-');
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthName = MONTH_NAMES_ID[monthIdx] || monthStr;
  return `${monthName} ${year}`;
}

/**
 * Convert monthYear string ('2026-09') to short label e.g. "Sep 2026"
 */
export function formatMonthYearShort(monthYear: string): string {
  if (!monthYear || !monthYear.includes('-')) return monthYear;
  const [yearStr, monthStr] = monthYear.split('-');
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthShort = MONTH_NAMES_SHORT_ID[monthIdx] || monthStr;
  return `${monthShort} '${String(year).slice(-2)}`;
}

/**
 * Calculate subsequent monthYear string from start
 * Example: addMonths('2026-09', 1) -> '2026-10'
 */
export function addMonths(startMonthYear: string, count: number): string {
  const [yearStr, monthStr] = startMonthYear.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);

  month += count;
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }

  const paddedMonth = month < 10 ? `0${month}` : `${month}`;
  return `${year}-${paddedMonth}`;
}

/**
 * Calculate difference in months between two 'YYYY-MM' strings (to - from).
 * Example: monthDiff('2026-09', '2026-12') -> 3
 */
export function monthDiff(fromMonthYear: string, toMonthYear: string): number {
  const [fy, fm] = fromMonthYear.split('-').map(v => parseInt(v, 10));
  const [ty, tm] = toMonthYear.split('-').map(v => parseInt(v, 10));
  return (ty - fy) * 12 + (tm - fm);
}

export const CATEGORY_META = {
  cicilan: {
    label: 'Cicilan & Pinjaman',
    color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
  },
  utilitas: {
    label: 'Tagihan & Utilitas',
    color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
  },
  kebutuhan: {
    label: 'Kebutuhan Pokok',
    color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900',
    badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200'
  },
  pribadi: {
    label: 'Jajan & Pribadi',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
  },
  lainnya: {
    label: 'Lain-lain',
    color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800',
    badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
  }
};