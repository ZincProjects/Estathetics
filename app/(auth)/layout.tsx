import { Logo } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="container-page flex h-14 items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 md:items-center">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
