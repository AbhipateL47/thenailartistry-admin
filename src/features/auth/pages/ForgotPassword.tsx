import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import apiClient from "@/api/client";
import { AxiosError } from "axios";
import { toast } from "@/shared/utils/toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiClient.post("/v1/admin/auth/forgot-password", { email });
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to send reset email");
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success("Password reset email sent! Please check your inbox.");
      setError("");
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message || error.message || "Failed to send reset email"
          : "Failed to send reset email";
      setError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email) {
      setError("Email is required");
      setIsLoading(false);
      return;
    }

    try {
      await forgotPasswordMutation.mutateAsync(email);
    } catch (err) {
      // Error handled in mutation
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">The Nail Artistry</h1>
          <p className="text-sm text-muted-foreground mt-1">INTERNAL OPERATOR</p>
        </div>

        {/* Forgot Password Card */}
        <Card className="bg-white">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-2">Forgot Password</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {error && (
              <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  EMAIL
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-white"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Secure Environment */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>SECURE ENVIRONMENT</span>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          © 2024 The Nail Artistry. Authorized Personnel Only.
        </p>
      </div>
    </div>
  );
}

