/**
 * Core domain model as the app sees it. Mirrors supabase/migrations/0001_init.sql
 * — keep the two in sync. Money is integer minor units (cents) plus an ISO
 * currency code, so TYB works internationally.
 *
 * The app only ever holds what the signed-in user is allowed to see. Private
 * details (legal name, birthdate, contact, bank and bill account details,
 * payment references) are never part of these types.
 */

/** Chosen at sign-up: "I want to send gifts" / "I want to receive gifts". */
export type Role = 'giver' | 'receiver';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type RequestKind = 'gift' | 'bill' | 'expense';

/**
 * Request lifecycle: draft → pending_review → live → fulfilled (one gift
 * covers it in full). `withdrawn`, `rejected` and `expired` are terminal.
 */
export type RequestStatus =
  | 'draft'
  | 'pending_review'
  | 'live'
  | 'fulfilled'
  | 'withdrawn'
  | 'rejected'
  | 'expired';

/** The giver's charge. Separate from the payout. */
export type PaymentStatus = 'awaiting_payment' | 'processing' | 'paid' | 'failed' | 'refunded' | 'disputed';

/** TYB's transfer of the net gift to the receiver. Separate from the payment. */
export type PayoutStatus = 'pending' | 'on_hold' | 'in_transit' | 'paid_out' | 'failed' | 'cancelled';

export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'withdrawn';

export type Prompt = { question: string; answer: string };

export type Photo = {
  id: string;
  /** Remote URL once uploaded; undefined for local placeholders. */
  uri?: string;
  /** Placeholder tone used until real photos exist. */
  tone?: string;
  position: number;
};

/** A receiver's public profile, as a verified giver sees it. */
export type ReceiverProfile = {
  id: string;
  displayName: string;
  /** Only if she chooses to show it. Birthdate itself is never exposed. */
  age?: number;
  /** City and country only — never suburb, distance or address. */
  city: string;
  countryCode: string;
  bio: string;
  prompts: Prompt[];
  photos: Photo[];
  verified: boolean;
};

/** A gift, bill or expense a receiver would like covered. Shown in full only. */
export type GiftRequest = {
  id: string;
  receiverId: string;
  kind: RequestKind;
  title: string;
  description?: string;
  amountCents: number;
  currency: string;
  status: RequestStatus;
  /** TYB privately checked the bill or expense (company, total, account stay hidden). */
  verifiedByTyb: boolean;
};

/** What the Discover deck shows: a receiver and her live requests. */
export type DiscoverCard = { profile: ReceiverProfile; requests: GiftRequest[] };

/** Giver's view of a gift he sent (`my_gifts_sent`). */
export type GiftSent = {
  id: string;
  receiverId: string;
  receiverDisplayName: string;
  requestId?: string;
  giftAmountCents: number;
  feeCents: number;
  totalCents: number;
  currency: string;
  /** Test/mock payment — not real money. */
  isTest: boolean;
  paymentStatus: PaymentStatus;
  payoutStatus?: PayoutStatus;
  createdAt: string;
  paidAt?: string;
};

/** Receiver's view of a gift she received (`my_gifts_received`). No sender payment details. */
export type GiftReceived = {
  id: string;
  giverId: string;
  giverDisplayName: string;
  requestId?: string;
  giftAmountCents: number;
  currency: string;
  isTest: boolean;
  paymentStatus: Extract<PaymentStatus, 'paid' | 'refunded' | 'disputed'>;
  payoutStatus?: PayoutStatus;
  payoutScheduledFor?: string;
  paidOutAt?: string;
  paidAt: string;
};

export type ConnectionRequest = {
  id: string;
  giverId: string;
  receiverId: string;
  giftId: string;
  note?: string;
  status: ConnectionStatus;
  createdAt: string;
  expiresAt?: string;
};

/** Platform rules. Null = not configured; checkout must not run without a fee. */
export type PlatformSettings = {
  feePercentBps: number | null;
  feeFixedCents: number | null;
  minGiftCents: number | null;
  payoutDelayHours: number | null;
  refundWindowDays: number | null;
  connectionExpiryDays: number | null;
};
