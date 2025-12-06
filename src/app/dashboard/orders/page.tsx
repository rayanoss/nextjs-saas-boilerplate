import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Track and manage customer orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { id: '#ORD-001', customer: 'John Doe', amount: '$249.99', status: 'Completed' },
              { id: '#ORD-002', customer: 'Jane Smith', amount: '$179.50', status: 'Processing' },
              { id: '#ORD-003', customer: 'Bob Johnson', amount: '$89.99', status: 'Shipped' },
              { id: '#ORD-004', customer: 'Alice Williams', amount: '$459.00', status: 'Pending' },
            ].map((order) => (
              <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                <div className="flex-1">
                  <p className="font-medium">{order.id}</p>
                  <p className="text-sm text-muted-foreground">{order.customer}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{order.amount}</p>
                  <p className="text-sm text-muted-foreground">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
