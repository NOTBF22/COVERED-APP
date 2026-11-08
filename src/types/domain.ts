/**
 * Core domain model. Mirrors supabase/migrations/0001_init.sql — keep the two
 * in sync. Money is always stored as integer cents (AUD by default).
 */

/** Supporters browse and cover bills; recipients list bills to be covered. */
export type Role = 'supporter' | 'recipient';

export type BillCategory =
  | 'rent'
  | 'electricity'
  | 'gas'
  | 'water'
  | 'internet'
  | 'phone'
  | 'groceries'
  | 'transport'
  | 'education'
  | 'medical'
  | 'other';

/**
 * Bill lifecycle:
 * draft → pending_review (doc uploaded) → live (verified, visible) →
 * funded (fully covered) → paid (TYB has paid the biller directly).
 * `rejected` and `expired` are terminal.
 */
export type BillStatus =
  | 'draft'
  | 'pending_review'
  | 'live'
  | 'funded'
  | 'paid'
  | 'rejected'
  | 'expired';

export type ContributionStatus = 'pending' | 'succeeded' | 'refunded' | 'failed';

export type SwipeDirection = 'pass' | 'like';

export type Prompt = { question: string; answer: string };

export type Photo = {
  id: string;
  /** Remote URL once uploaded; undefined for local placeholders. */
  uri?: string;
  /** Placeholder tone used until real photos exist. */
  tone?: string;
  position: number;
};

export type Profile = {
  id: string;
  role: Role;
  displayName: string;
  age: number;
  city: string;
  bio: string;
  prompts: Prompt[];
  photos: Photo[];
  /** ID + liveness check passed (step 3). */
  verified: boolean;
};

export type Bill = {
  id: string;
  recipientId: string;
  category: BillCategory;
  /** Who gets paid — TYB pays this biller directly, never the person. */
  billerName: string;
  amountCents: number;
  /** Sum of succeeded contributions. */
  coveredCents: number;
  currency: 'AUD';
  dueDate: string; // ISO date
  note?: string;
  status: BillStatus;
};

export type Contribution = {
  id: string;
  supporterId: string;
  billId: string;
  amountCents: number;
  feeCents: number;
  status: ContributionStatus;
  createdAt: string;
};

/** What the Discover deck shows: a recipient and their live bills. */
export type DiscoverCard = { profile: Profile; bills: Bill[] };
