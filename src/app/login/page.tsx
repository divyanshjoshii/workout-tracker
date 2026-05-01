"use client";

import { login, signup } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    
    const formData = new FormData(event.currentTarget);
    const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("formAction");
    
    let result;
    if (action === "signup") {
      result = await signup(formData);
    } else {
      result = await login(formData);
    }

    if (result?.error) {
      setError(result.error);
    }
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
            Enter your email to sign in or create an account.
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
                className="bg-background border-border text-foreground focus-visible:ring-primary"
              />
            </div>
            {error && (
              <div className="text-sm text-destructive font-medium">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <Button 
                type="submit" 
                formAction="login" 
                disabled={isPending}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                Sign In
              </Button>
              <Button 
                type="submit" 
                formAction="signup" 
                variant="outline" 
                disabled={isPending}
                className="w-full border-border text-foreground hover:bg-accent hover:text-accent-foreground font-semibold"
              >
                Sign Up
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
