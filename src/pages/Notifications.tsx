import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Notifications() {
  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-muted-foreground mb-2">
          <span>Home</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">Notifications</span>
        </nav>
        <h1 className="text-3xl font-semibold">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your notifications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Notifications page content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

