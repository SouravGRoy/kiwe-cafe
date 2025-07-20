"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { signIn, signUp } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface AdminAuthProps {
  onAuthSuccess: () => void;
}

export function AdminAuth({ onAuthSuccess }: AdminAuthProps) {
  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("admin123456");
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const { toast } = useToast();

  const testConnection = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("count")
        .limit(1);
      if (error) {
        setDebugInfo(`Database connection failed: ${error.message}`);
      } else {
        setDebugInfo("Database connection successful!");
      }
    } catch (err: any) {
      setDebugInfo(`Connection test failed: ${err.message}`);
    }
  };

  const createTestAdmin = async () => {
    setLoading(true);
    setDebugInfo("Creating test admin...");

    try {
      // First, try to sign up
      const { data: signUpData, error: signUpError } = await signUp(
        email,
        password
      );

      if (signUpError && (signUpError as Error).message) {
        if ((signUpError as Error).message.includes("already registered")) {
          setDebugInfo("User already exists, trying to sign in...");

          // Try to sign in instead
          const { data: signInData, error: signInError } = await signIn(
            email,
            password
          );

          if (signInError) {
            throw new Error(
              `Sign in failed: ${(signInError as Error).message}`
            );
          }

          if (signInData?.user) {
            // Check if user has admin role
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", signInData?.user?.id)
              .single();

            if (profileError) {
              // Create profile if it doesn't exist
              const { error: insertError } = await supabase
                .from("profiles")
                .insert({
                  id: signInData?.user?.id,
                  email: signInData?.user?.email,
                  role: "admin",
                });

              if (insertError) {
                throw new Error(
                  `Failed to create profile: ${insertError.message}`
                );
              }
            } else if (profile.role !== "admin") {
              // Update role to admin
              const { error: updateError } = await supabase
                .from("profiles")
                .update({ role: "admin" })
                .eq("id", signInData?.user?.id);

              if (updateError) {
                throw new Error(
                  `Failed to update role: ${updateError.message}`
                );
              }
            }

            setDebugInfo("Successfully signed in as admin!");
            toast({
              title: "Success!",
              description: "Signed in as admin successfully.",
            });

            setTimeout(onAuthSuccess, 1000);
          }
        } else {
          throw new Error(`Sign up failed: ${(signUpError as Error).message}`);
        }
      } else if (signUpData?.user) {
        // New user created, make them admin
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: signUpData?.user?.id,
          email: signUpData?.user?.email,
          role: "admin",
        });

        if (profileError) {
          console.warn("Profile creation failed:", profileError);
        }

        setDebugInfo("Test admin created successfully!");
        toast({
          title: "Success!",
          description: "Test admin account created and signed in.",
        });

        setTimeout(onAuthSuccess, 1000);
      }
    } catch (error: any) {
      console.error("Create test admin error:", error);
      setDebugInfo(`Error: ${error.message}`);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDebugInfo("Attempting authentication...");

    try {
      // Try sign in first
      const { data: signInData, error: signInError } = await signIn(
        email,
        password
      );

      if (signInError) {
        if (
          (signInError as Error).message?.includes("Invalid login credentials")
        ) {
          // Try to sign up
          setDebugInfo("User not found, creating new account...");
          const { data: signUpData, error: signUpError } = await signUp(
            email,
            password
          );

          if (signUpError) {
            throw new Error(
              `Sign up failed: ${(signUpError as Error).message}`
            );
          }

          if (signUpData?.user) {
            // Make new user admin
            await supabase.from("profiles").upsert({
              id: signUpData?.user?.id,
              email: signUpData?.user?.email,
              role: "admin",
            });

            setDebugInfo("New admin account created!");
            toast({
              title: "Account Created",
              description: "New admin account created successfully.",
            });

            setTimeout(onAuthSuccess, 1000);
          }
        } else {
          throw new Error(`Sign in failed: ${(signInError as Error).message}`);
        }
      } else if (signInData?.user) {
        setDebugInfo("Sign in successful!");
        toast({
          title: "Success",
          description: "Signed in successfully.",
        });

        setTimeout(onAuthSuccess, 1000);
      }
    } catch (error: any) {
      console.error("Manual auth error:", error);
      setDebugInfo(`Error: ${error.message}`);
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {debugInfo && (
            <Alert>
              <AlertDescription className="text-sm">
                {debugInfo}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleManualAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Authenticating..." : "Sign In"}
            </Button>
          </form>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={createTestAdmin}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Test Admin (admin@test.com)"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={testConnection}
              disabled={loading}
            >
              Test Database Connection
            </Button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>
              <strong>Test Credentials:</strong>
            </p>
            <p>Email: admin@test.com</p>
            <p>Password: admin123456</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
