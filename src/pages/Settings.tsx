import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-muted-foreground mb-2">
          <span>Home</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">Settings</span>
        </nav>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your application settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Settings page content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

