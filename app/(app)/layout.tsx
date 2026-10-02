import Link from "next/link";
import { DesktopNav, MobileTabBar } from "@/components/app-shell/nav";
import { UserMenu } from "@/components/app-shell/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { homeFor, requireProfile } from "@/lib/auth";

const ROLE_LABEL = { interior_designer: "Interior designer", agent: "Property agent", buyer: "Buyer", admin: "Admin" } as const;

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await requireProfile();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="container-page flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href={homeFor(profile.role)} className="font-heading text-xl tracking-tight">
              Estathetics<span className="text-brand">.</span>
            </Link>
            <DesktopNav role={profile.role} />
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu name={profile.full_name ?? "You"} email={profile.email} roleLabel={ROLE_LABEL[profile.role]} />
          </div>
        </div>
      </header>
      <main className="container-page flex-1 pb-24 pt-6 md:pb-12">{children}</main>
      <MobileTabBar role={profile.role} />
    </div>
  );
}
