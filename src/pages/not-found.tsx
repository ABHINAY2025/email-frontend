import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/states';
import { Page } from '@/components/layout/page';

export default function NotFoundPage() {
  return (
    <Page>
      <EmptyState
        className="py-24"
        icon={Compass}
        title="Page not found"
        description="The page you're looking for doesn't exist or was moved."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">Back to overview</Link>
          </Button>
        }
      />
    </Page>
  );
}
