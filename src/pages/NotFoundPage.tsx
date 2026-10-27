import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export function NotFoundPage() {
  return (
    <EmptyState
      icon={<Compass className="size-6" />}
      title="Lost at sea"
      description="This page does not exist. The log is still safe — head back to your tournaments."
      action={
        <Link to="/" className="btn-primary">
          Back to tournaments
        </Link>
      }
    />
  );
}
