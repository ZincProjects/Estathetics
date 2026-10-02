import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Common = { label: string; name: string; error?: string[]; hint?: React.ReactNode; className?: string };

export function Field({
  label,
  name,
  error,
  hint,
  className,
  ...props
}: Common & Omit<React.ComponentProps<"input">, "name">) {
  const id = props.id ?? name;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        aria-invalid={error?.length ? true : undefined}
        aria-describedby={error?.length ? `${id}-error` : undefined}
        className="h-11 text-base md:h-10 md:text-sm"
        {...props}
      />
      <FieldMessage id={`${id}-error`} error={error} hint={hint} />
    </div>
  );
}

export function TextareaField({
  label,
  name,
  error,
  hint,
  className,
  ...props
}: Common & Omit<React.ComponentProps<"textarea">, "name">) {
  const id = props.id ?? name;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        name={name}
        aria-invalid={error?.length ? true : undefined}
        className="text-base md:text-sm"
        {...props}
      />
      <FieldMessage id={`${id}-error`} error={error} hint={hint} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  error,
  hint,
  className,
  options,
  placeholder,
  ...props
}: Common &
  Omit<React.ComponentProps<"select">, "name"> & {
    options: readonly { value: string; label: string }[];
    placeholder?: string;
  }) {
  const id = props.id ?? name;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={name}
        aria-invalid={error?.length ? true : undefined}
        className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive md:h-10 md:text-sm dark:bg-input/30"
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldMessage id={`${id}-error`} error={error} hint={hint} />
    </div>
  );
}

export function FieldMessage({ id, error, hint }: { id: string; error?: string[]; hint?: React.ReactNode }) {
  if (error?.length) {
    return (
      <p id={id} className="text-sm text-destructive">
        {error[0]}
      </p>
    );
  }
  return hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null;
}

export function FormMessage({ message, ok }: { message?: string; ok?: boolean }) {
  if (!message) return null;
  return (
    <p
      role={ok ? "status" : "alert"}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        ok
          ? "border-success/30 bg-success/10 text-foreground"
          : "border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      {message}
    </p>
  );
}
