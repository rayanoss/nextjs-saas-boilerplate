import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="text-muted-foreground">Manage your customer base</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Customers</CardTitle>
          <CardDescription>Your newest sign-ups</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'John Doe', email: 'john@example.com', joined: '2 days ago' },
              { name: 'Jane Smith', email: 'jane@example.com', joined: '3 days ago' },
              { name: 'Bob Johnson', email: 'bob@example.com', joined: '5 days ago' },
              { name: 'Alice Williams', email: 'alice@example.com', joined: '1 week ago' },
            ].map((customer) => (
              <div key={customer.email} className="flex items-center justify-between border-b pb-4 last:border-0">
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                </div>
                <p className="text-sm text-muted-foreground">{customer.joined}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
