import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-muted-foreground mb-2">
          <span>Home</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">Analytics</span>
        </nav>
        <h1 className="text-3xl font-semibold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          View analytics and insights for your store
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Analytics page content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

