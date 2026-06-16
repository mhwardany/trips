export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');

export const fmt = (n: number | string | undefined, digits = 2): string => {
  const num = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US', { maximumFractionDigits: digits });
};

export const isTrue = (v: unknown): boolean => v === true || v === 'TRUE' || v === 'true';

export const todayIso = (): string => new Date().toISOString().slice(0, 10);

export const formatDateLocal = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  if (String(dateStr).includes('T')) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return String(dateStr).slice(0, 10);
};

export const parseNumInput = (val: string): string => {
  return val.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]).replace(/٫/g, '.');
};
