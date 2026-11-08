import type { PaymentStatus, PayoutStatus, RequestKind, RequestStatus } from '@/types/domain';

const formatters = new Map<string, Intl.NumberFormat>();

/** Format minor units in any currency, e.g. (64000, 'AUD') → "$640.00". */
export function formatMoney(cents: number, currency: string): string {
  let f = formatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat('en-AU', { style: 'currency', currency });
    formatters.set(currency, f);
  }
  return f.format(cents / 100);
}

const regionNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;

/** "Sydney, Australia" — city and country only, by design. */
export function formatPlace(city: string, countryCode: string): string {
  return `${city}, ${regionNames?.of(countryCode) ?? countryCode}`;
}

export const requestKindLabel: Record<RequestKind, string> = {
  gift: 'Gift',
  bill: 'Bill',
  expense: 'Expense',
};

export const requestStatusLabel: Record<RequestStatus, string> = {
  draft: 'Draft',
  pending_review: 'In review',
  live: 'Live',
  fulfilled: 'Gifted',
  withdrawn: 'Withdrawn',
  rejected: 'Not approved',
  expired: 'Expired',
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  processing: 'Payment processing',
  paid: 'Paid',
  failed: 'Payment failed',
  refunded: 'Refunded',
  disputed: 'Disputed',
};

export const payoutStatusLabel: Record<PayoutStatus, string> = {
  pending: 'Payout pending',
  on_hold: 'Payout on hold',
  in_transit: 'Payout on its way',
  paid_out: 'Paid out',
  failed: 'Payout failed',
  cancelled: 'Payout cancelled',
};
