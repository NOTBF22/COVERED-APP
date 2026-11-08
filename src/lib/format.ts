import type { BillCategory } from '@/types/domain';

const aud = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });

export function formatCents(cents: number): string {
  return aud.format(cents / 100);
}

export function formatDue(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export const categoryLabel: Record<BillCategory, string> = {
  rent: 'Rent',
  electricity: 'Electricity',
  gas: 'Gas',
  water: 'Water',
  internet: 'Internet',
  phone: 'Phone',
  groceries: 'Groceries',
  transport: 'Transport',
  education: 'Education',
  medical: 'Medical',
  other: 'Other',
};
