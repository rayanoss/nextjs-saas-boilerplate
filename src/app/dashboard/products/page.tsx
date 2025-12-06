import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="text-muted-foreground">Manage your product catalog</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { name: 'Product A', price: '$49.99', stock: 150 },
          { name: 'Product B', price: '$79.99', stock: 85 },
          { name: 'Product C', price: '$99.99', stock: 42 },
        ].map((product) => (
          <Card key={product.name}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.price}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Stock: {product.stock} units</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
