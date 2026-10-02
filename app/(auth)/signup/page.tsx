import type { Metadata } from "next";
import Link from "next/link";
import { SignupFlow } from "./signup-form";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { role } = await searchParams;
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl">Create your studio</h1>
        <p className="text-muted-foreground">Free to start. No credit card needed.</p>
      </div>
      <SignupFlow initialRole={typeof role === "string" ? role : undefined} />
      <p className="text-center text-xs text-muted-foreground">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
