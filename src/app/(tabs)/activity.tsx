import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/providers/AuthProvider';

/** Contribution history: what you've covered, or what's been covered for you. */
export default function Activity() {
  const { session } = useAuth();
  const supporter = session?.role === 'supporter';

  return (
    <Screen>
      <EmptyState
        title={supporter ? 'Nothing covered yet' : 'No contributions yet'}
        body={
          supporter
            ? 'Bills you help cover will show here, with a receipt for each.'
            : 'When someone covers part of a bill, you’ll see it here.'
        }
      />
    </Screen>
  );
}
