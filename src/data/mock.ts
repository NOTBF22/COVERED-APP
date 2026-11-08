import type { Bill, DiscoverCard, Profile } from '@/types/domain';

/**
 * Fictional sample data so every screen works before the backend is wired up
 * (step 2). Photos are colour placeholders — no real people.
 */

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

const profiles: Profile[] = [
  {
    id: 'p1',
    role: 'recipient',
    displayName: 'Amelia',
    age: 26,
    city: 'Surry Hills',
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
    role: 'recipient',
    displayName: 'Priya',
    age: 29,
    city: 'Newtown',
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
    role: 'recipient',
    displayName: 'Jess',
    age: 31,
    city: 'Marrickville',
    bio: 'Single mum of one very loud four-year-old. Pottery on Thursdays is my therapy.',
    prompts: [{ question: 'Proudest of', answer: 'Finishing my TAFE cert with a toddler on my hip.' }],
    photos: [
      { id: 'p3a', tone: '#DCC0B4', position: 0 },
      { id: 'p3b', tone: '#BE9A8C', position: 1 },
    ],
    verified: false,
  },
];

const bills: Bill[] = [
  { id: 'b1', recipientId: 'p1', category: 'rent', billerName: 'Ray White Surry Hills', amountCents: 64000, coveredCents: 21000, currency: 'AUD', dueDate: inDays(9), status: 'live' },
  { id: 'b2', recipientId: 'p1', category: 'electricity', billerName: 'AGL', amountCents: 18450, coveredCents: 0, currency: 'AUD', dueDate: inDays(14), status: 'live' },
  { id: 'b3', recipientId: 'p2', category: 'internet', billerName: 'Aussie Broadband', amountCents: 8900, coveredCents: 4000, currency: 'AUD', dueDate: inDays(5), status: 'live' },
  { id: 'b4', recipientId: 'p3', category: 'groceries', billerName: 'Woolworths (gift card)', amountCents: 15000, coveredCents: 0, currency: 'AUD', dueDate: inDays(3), status: 'live' },
  { id: 'b5', recipientId: 'p3', category: 'education', billerName: 'Goodstart Early Learning', amountCents: 32000, coveredCents: 12000, currency: 'AUD', dueDate: inDays(20), status: 'live' },
];

export const mockDeck: DiscoverCard[] = profiles.map((profile) => ({
  profile,
  bills: bills.filter((b) => b.recipientId === profile.id && b.status === 'live'),
}));

export const mockMyBills: Bill[] = bills.filter((b) => b.recipientId === 'p1');
