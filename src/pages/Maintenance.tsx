import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Settings className="h-8 w-8 text-muted-foreground animate-spin" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold mb-3">Admin Panel Under Maintenance</h1>
          <p className="text-muted-foreground">
            We're performing scheduled maintenance. The admin panel will be back online shortly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

