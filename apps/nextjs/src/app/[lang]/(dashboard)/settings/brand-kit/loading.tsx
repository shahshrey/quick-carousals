import { Card, CardContent, CardHeader } from '@saasfly/ui/card';
import { Skeleton } from '@saasfly/ui/skeleton';
import { DashboardShell } from '~/components/shell';

export default function BrandKitLoadingPage() {
  return (
    <DashboardShell
      title="Brand Kit"
      description="Manage your brand identity for consistent carousels."
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
