"use client";

import { useActionState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await loginAction(formData);
      return result ?? null;
    },
    null
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950 p-4">
      <Card className="w-full max-w-md border-zinc-800">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl">AI Company OS</CardTitle>
          <CardDescription>
            Sign in to manage your virtual AI workforce
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue="ceo@novacoffee.demo"
                autoComplete="email"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                defaultValue="demo1234"
                autoComplete="current-password"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
            {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in to Nova Coffee GmbH"
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-zinc-500">
            Demo: ceo@novacoffee.demo / demo1234
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
