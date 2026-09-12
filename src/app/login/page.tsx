"use client";

import { login, signup } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KittySit } from "@/components/kitty/kitty";
import { Watchful } from "@/components/kitty/watchful";
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
    <div className="flex min-h-[calc(100dvh-6.5rem)] items-center justify-center px-4 pt-28 pb-4">
      <div className="tile relative w-full max-w-sm p-6 pt-7">
        <Watchful className="absolute -top-[101px] left-1/2 w-[96px] -translate-x-1/2">
          <KittySit className="w-full" />
        </Watchful>

        <div className="text-center">
          <h1 className="font-display text-title">Workout Tracker</h1>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            {mode === "signup"
              ? "Create an account to start tracking."
              : "Sign in to your account."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          {error && (
            <div role="alert" className="rounded-2xl bg-destructive-soft p-3 text-sm font-bold text-destructive">
              {error}
              {mode === "login" && (
                <div className="mt-1 font-medium text-foreground">
                  Check the email spelling. If you have never signed up on this
                  address, create an account below instead.
                </div>
              )}
            </div>
          )}

          {message && (
            <div role="status" className="rounded-2xl bg-mint p-3 text-sm font-bold text-mint-foreground">{message}</div>
          )}

          <Button type="submit" size="lg" disabled={isPending} className="mt-1 w-full">
            {isPending
              ? (mode === "signup" ? "Creating account..." : "Signing in...")
              : (mode === "signup" ? "Create account" : "Sign in")}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm font-bold text-muted-foreground">
          {mode === "signup" ? "Already have an account?" : "No account yet?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(mode === "signup" ? "login" : "signup")}
            className="text-strawberry underline-offset-4 hover:underline"
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
