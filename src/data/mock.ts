import type { DiscoverCard, GiftReceived, GiftRequest, GiftSent, PlatformSettings, ReceiverProfile } from '@/types/domain';

/**
 * Fictional sample data so every screen works before the backend is wired up.
 * Photos are colour placeholders — no real people. All gifts here are test
 * records, not real payments.
 */

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

/** Nothing configured yet — the fee is never invented. */
export const mockSettings: PlatformSettings = {
  feePercentBps: null,
  feeFixedCents: null,
  minGiftCents: null,
  payoutDelayHours: null,
  refundWindowDays: null,
  connectionExpiryDays: null,
};

const profiles: ReceiverProfile[] = [
  {
    id: 'p1',
    displayName: 'Amelia',
    age: 26,
    city: 'Sydney',
    countryCode: 'AU',
    bio: 'Nursing grad working nights at RPA. Weekends are for markets and long swims at Bronte.',
    prompts: [
      { question: 'A perfect Sunday', answer: 'Flat white, Carriageworks market, a nap I did not plan.' },
      { question: 'What this would change', answer: 'One less month choosing between rent and my placement fees.' },
    ],
    photos: [
      { id: 'p1a', tone: '#E3C2B8', position: 0 },
      { id: 'p1b', tone: '#C99E95', position: 1 },
      { id: 'p1c', tone: '#EBD3CB', position: 2 },
    ],
    verified: true,
  },
  {
    id: 'p2',
    displayName: 'Priya',
    age: 29,
    city: 'Sydney',
    countryCode: 'AU',
    bio: 'Architecture student by day, bookshop by night. Will recommend you a novel whether you ask or not.',
    prompts: [
      { question: 'Currently reading', answer: 'Something with a map in the front.' },
      { question: 'What this would change', answer: 'Keeping the lights on through final studio.' },
    ],
    photos: [
      { id: 'p2a', tone: '#D8B4B2', position: 0 },
      { id: 'p2b', tone: '#B98B8C', position: 1 },
    ],
    verified: true,
  },
  {
    id: 'p3',
    displayName: 'Jess',
    age: 31,
    city: 'Sydney',
    countryCode: 'AU',
    bio: 'Single mum of one very loud four-year-old. Pottery on Thursdays is my therapy.',
    prompts: [{ question: 'Proudest of', answer: 'Finishing my TAFE cert with a toddler on my hip.' }],
    photos: [
      { id: 'p3a', tone: '#DCC0B4', position: 0 },
      { id: 'p3b', tone: '#BE9A8C', position: 1 },
    ],
    verified: true,
  },
];

const requests: GiftRequest[] = [
  { id: 'r1', receiverId: 'p1', kind: 'bill', title: 'Rent', description: 'This month’s rent.', amountCents: 64000, currency: 'AUD', status: 'live', verifiedByTyb: true },
  { id: 'r2', receiverId: 'p1', kind: 'bill', title: 'Electricity', amountCents: 18450, currency: 'AUD', status: 'live', verifiedByTyb: true },
  { id: 'r3', receiverId: 'p2', kind: 'bill', title: 'Internet', description: 'Keeping me online through final studio.', amountCents: 8900, currency: 'AUD', status: 'live', verifiedByTyb: true },
  { id: 'r4', receiverId: 'p3', kind: 'expense', title: 'Groceries', amountCents: 15000, currency: 'AUD', status: 'live', verifiedByTyb: false },
  { id: 'r5', receiverId: 'p3', kind: 'bill', title: 'Childcare', description: 'Two weeks of kindy.', amountCents: 32000, currency: 'AUD', status: 'live', verifiedByTyb: true },
];

export const mockDeck: DiscoverCard[] = profiles.map((profile) => ({
  profile,
  requests: requests.filter((r) => r.receiverId === profile.id && r.status === 'live'),
}));

/** Amelia's own requests (the receiver preview account). */
export const mockMyRequests: GiftRequest[] = [
  ...requests.filter((r) => r.receiverId === 'p1'),
  { id: 'r6', receiverId: 'p1', kind: 'expense', title: 'Placement textbooks', amountCents: 21000, currency: 'AUD', status: 'pending_review', verifiedByTyb: false },
];

/** Giver preview account's history. Fee 0 because no fee is configured yet. */
export const mockGiftsSent: GiftSent[] = [
  { id: 'g1', receiverId: 'p2', receiverDisplayName: 'Priya', requestId: 'r0', giftAmountCents: 12000, feeCents: 0, totalCents: 12000, currency: 'AUD', isTest: true, paymentStatus: 'paid', payoutStatus: 'paid_out', createdAt: daysAgo(9), paidAt: daysAgo(9) },
  { id: 'g2', receiverId: 'p1', receiverDisplayName: 'Amelia', giftAmountCents: 5000, feeCents: 0, totalCents: 5000, currency: 'AUD', isTest: true, paymentStatus: 'paid', payoutStatus: 'pending', createdAt: daysAgo(1), paidAt: daysAgo(1) },
];

/** Receiver preview account's history. */
export const mockGiftsReceived: GiftReceived[] = [
  { id: 'g2', giverId: 'm1', giverDisplayName: 'James', giftAmountCents: 5000, currency: 'AUD', isTest: true, paymentStatus: 'paid', payoutStatus: 'pending', paidAt: daysAgo(1) },
  { id: 'g0', giverId: 'm2', giverDisplayName: 'Tom', requestId: 'r0', giftAmountCents: 9500, currency: 'AUD', isTest: true, paymentStatus: 'paid', payoutStatus: 'paid_out', paidAt: daysAgo(14), paidOutAt: daysAgo(12) },
];
