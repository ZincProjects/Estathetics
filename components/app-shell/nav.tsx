"use client";

import { Building2, FolderOpen, Inbox, Palette, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV: Record<"interior_designer" | "agent", { href: string; label: string; icon: typeof FolderOpen }[]> = {
  interior_designer: [
    { href: "/designer", label: "Projects", icon: FolderOpen },
    { href: "/designer/themes", label: "Themes", icon: Palette },
    { href: "/leads", label: "Leads", icon: Inbox },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
  agent: [
    { href: "/agent", label: "Listings", icon: Building2 },
    { href: "/leads", label: "Leads", icon: Inbox },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
};

function itemsFor(role: Role) {
  return role === "agent" ? NAV.agent : NAV.interior_designer;
}

function isActive(pathname: string, href: string) {
  if (href === "/designer" || href === "/agent") {
    return pathname === href || (pathname.startsWith(`${href}/`) && !pathname.startsWith(`${href}/themes`));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
      {itemsFor(role).map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm transition-colors",
            isActive(pathname, href) ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileTabBar({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="flex">
        {itemsFor(role).map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px]",
                  active ? "text-brand" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
