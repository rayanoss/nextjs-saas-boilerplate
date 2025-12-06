import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track your performance and metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Page Views</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">45,231</p>
            <p className="text-sm text-muted-foreground">+18% from previous week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">3.24%</p>
            <p className="text-sm text-muted-foreground">+0.5% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Traffic Sources</CardTitle>
          <CardDescription>Where your visitors come from</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Organic Search</span>
              <span className="text-sm text-muted-foreground">42%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Direct</span>
              <span className="text-sm text-muted-foreground">28%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Social Media</span>
              <span className="text-sm text-muted-foreground">18%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Referral</span>
              <span className="text-sm text-muted-foreground">12%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
