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
import { supabase } from "@/lib/supabase";

interface SimpleAdminAuthProps {
  onAuthSuccess: () => void;
}

// Simple admin login function inline
async function adminLogin(email: string, password: string) {
  try {
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error || !data) {
      return { success: false, error: "Invalid credentials" };
    }

    // Store admin session in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "admin_session",
        JSON.stringify({
          id: data.id,
          email: data.email,
          loginTime: Date.now(),
        })
      );
    }

    return { success: true, admin: data };
  } catch (error) {
    return { success: false, error: "Login failed" };
  }
}

export function SimpleAdminAuth({ onAuthSuccess }: SimpleAdminAuthProps) {
  const [email, setEmail] = useState("admin@cafe.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await adminLogin(email, password);

      if (result.success) {
        toast({
          title: "Login Successful",
          description: "Welcome to the admin dashboard!",
        });
        onAuthSuccess();
      } else {
        toast({
          title: "Login Failed",
          description: result.error || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
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
            Enter your admin credentials to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              <strong>Default Admin Credentials:</strong>
              <br />
              Email: admin@cafe.com
              <br />
              Password: admin123
            </AlertDescription>
          </Alert>

          <form onSubmit={handleLogin} className="space-y-4">
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
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
