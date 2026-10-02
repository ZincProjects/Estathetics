"use client";

import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

/** Button that asks for confirmation, then runs a server action. */
export function ConfirmAction({
  action,
  confirm,
  children,
  variant = "destructive",
  size,
  className,
  "aria-label": ariaLabel,
}: {
  action: () => Promise<unknown>;
  confirm: string;
  children: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  "aria-label"?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      aria-label={ariaLabel}
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirm)) start(async () => void (await action()));
      }}
    >
      {pending ? <Loader2 className="animate-spin" /> : children}
    </Button>
  );
}
