"use client";

import { login, signup } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  // Signing in and creating an account used to be two submit buttons side by
  // side, so a failed sign-in put "Sign Up" one click away and quietly made a
  // second, empty account. One mode at a time, switched deliberately.
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const result = mode === "signup" ? await signup(formData) : await login(formData);

    if (result?.error) setError(result.error);
    if (result?.message) setMessage(result.message);
    setIsPending(false);
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm border-border bg-card shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <Dumbbell className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Workout Tracker
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {mode === "signup"
              ? "Create an account to start tracking."
              : "Sign in to your account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
                autoComplete="email"
                className="bg-background border-border text-foreground focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="bg-background border-border text-foreground focus-visible:ring-primary"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive font-medium">
                {error}
                {mode === "login" && (
                  <div className="text-muted-foreground font-normal mt-1">
                    Check the email spelling. If you have never signed up on this
                    address, create an account below instead.
                  </div>
                )}
              </div>
            )}

            {message && (
              <div className="text-sm text-primary font-medium">{message}</div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {isPending
                ? (mode === "signup" ? "Creating account..." : "Signing in...")
                : (mode === "signup" ? "Create Account" : "Sign In")}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground mt-4">
            {mode === "signup" ? "Already have an account?" : "No account yet?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(mode === "signup" ? "login" : "signup")}
              className="text-primary font-medium hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
