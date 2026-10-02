import { roomSvg } from "@/lib/images/mock-room";
import { getPresetTheme, paletteToRender } from "@/lib/themes";
import { cn } from "@/lib/utils";

export type ThemeLike = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  palette: string[];
  materials: string[];
  mood: string[];
  is_preset: boolean;
};

/** Small illustrated preview of a room rendered in the theme's palette. */
export function themePreviewSrc(theme: Pick<ThemeLike, "slug" | "palette" | "is_preset">) {
  const render = (theme.is_preset && getPresetTheme(theme.slug)?.render) || paletteToRender(theme.palette);
  return `data:image/svg+xml;utf8,${encodeURIComponent(roomSvg("living", render, { width: 400 }))}`;
}

export function Swatches({ palette, className }: { palette: string[]; className?: string }) {
  return (
    <div className={cn("flex overflow-hidden rounded-full border border-border", className)} aria-label="Colour palette">
      {palette.map((c, i) => (
        <span key={`${c}-${i}`} className="h-4 flex-1" style={{ backgroundColor: c }} title={c} />
      ))}
    </div>
  );
}

export function ThemeCard({
  theme,
  selected,
  footer,
}: {
  theme: ThemeLike;
  selected?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-shadow",
        selected ? "border-brand ring-3 ring-brand/30" : "border-border",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={themePreviewSrc(theme)} alt="" className="aspect-[4/3] w-full object-cover" />
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-base leading-tight sm:text-lg">{theme.name}</h3>
          {!theme.is_preset && <span className="text-[11px] tracking-wide text-brand uppercase">Custom</span>}
        </div>
        <Swatches palette={theme.palette} />
        {theme.description && <p className="line-clamp-2 hidden text-sm text-muted-foreground sm:block">{theme.description}</p>}
        <p className="text-xs text-muted-foreground">{theme.materials.slice(0, 4).join(" · ")}</p>
        {footer && <div className="mt-auto pt-2">{footer}</div>}
      </div>
    </div>
  );
}
