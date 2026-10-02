import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`font-heading text-xl tracking-tight ${className}`}>
      Estathetics<span className="text-brand">.</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container-page flex h-14 items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-1">
          <ThemeToggle />
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            Log in
          </Link>
          <Link href="/signup" className={buttonVariants()}>
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 py-8 text-sm text-muted-foreground">
      <div className="container-page flex flex-col gap-2 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Estathetics. Made in Singapore.</p>
        <nav className="flex gap-4">
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
