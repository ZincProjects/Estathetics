import type { Metadata } from "next";
import Link from "next/link";
import { GoogleButton } from "@/components/forms/google-button";
import { Separator } from "@/components/ui/separator";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl">Welcome back</h1>
        <p className="text-muted-foreground">Sign in to your studio.</p>
      </div>
      {process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true" && (
        <>
          <GoogleButton next={nextPath} />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Separator className="flex-1" /> or with email <Separator className="flex-1" />
          </div>
        </>
      )}
      <LoginForm next={nextPath} error={typeof error === "string" ? error : undefined} />
      <p className="text-center text-sm text-muted-foreground">
        New to Estathetics?{" "}
        <Link href="/signup" className="text-foreground underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}
