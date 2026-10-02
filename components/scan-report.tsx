import { AlertTriangle, DoorOpen, Lightbulb, Ruler, Sofa, Sun, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CONSTRAINT_LABELS, type RoomScan } from "@/lib/schemas/room-scan";
import { formatArea, formatLength } from "@/lib/units";
import { cn } from "@/lib/utils";

const CONFIDENCE_STYLE = {
  low: "bg-destructive/10 text-destructive",
  medium: "bg-accent text-accent-foreground",
  high: "bg-success/15 text-foreground",
} as const;

function Section({ icon: Icon, title, children }: { icon: typeof Ruler; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 font-sans text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        <Icon className="size-4 text-brand" /> {title}
      </h3>
      <div className="text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export function ScanReport({ scan, meta, actions }: { scan: RoomScan; meta?: React.ReactNode; actions?: React.ReactNode }) {
  const d = scan.dimensions;
  const area = d.area_sqm ?? (d.length_m && d.width_m ? d.length_m * d.width_m : null);
  return (
    <article className="space-y-6 rounded-2xl border border-border bg-card p-5" aria-label="Scan report">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs tracking-wide text-brand uppercase">Scan report</p>
          <h2 className="text-2xl">{scan.room_type}</h2>
          {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
        </div>
        {actions}
      </header>

      <p className="text-[0.95rem] leading-relaxed">{scan.summary}</p>

      {!scan.photo_quality.usable && (
        <p className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" /> This photo may not be usable: {scan.photo_quality.issues.join("; ")}
        </p>
      )}

      <Section icon={Ruler} title="Dimensions">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge className={cn("capitalize", CONFIDENCE_STYLE[d.confidence])}>{d.confidence} confidence</Badge>
          <span className="text-xs font-medium text-destructive">Estimated, verify on site</span>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          {[
            ["Length", formatLength(d.length_m)],
            ["Width", formatLength(d.width_m)],
            ["Area", formatArea(area)],
            ["Ceiling", formatLength(d.ceiling_height_m)],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted-foreground">{k} (est.)</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">Based on: {d.basis}</p>
      </Section>

      <Section icon={Sun} title="Light">
        <p>
          <span className="font-medium capitalize">{scan.natural_light.level}</span> · {scan.natural_light.direction}
        </p>
        {scan.natural_light.notes && <p className="text-muted-foreground">{scan.natural_light.notes}</p>}
      </Section>

      <Section icon={DoorOpen} title="Openings & finishes">
        <ul className="space-y-1">
          {scan.windows.map((w, i) => (
            <li key={`w${i}`}>
              <span className="font-medium">Window</span>: {w.type}, {w.location}
              {w.approx_width_m ? `, about ${w.approx_width_m} m wide (est.)` : ""}
              {w.notes ? `. ${w.notes}` : ""}
            </li>
          ))}
          {scan.doors.map((dr, i) => (
            <li key={`d${i}`}>
              <span className="font-medium">Door</span>: {dr.type}, {dr.location}
              {dr.notes ? `. ${dr.notes}` : ""}
            </li>
          ))}
          <li>
            <span className="font-medium">Floor</span>: {scan.flooring.material} ({scan.flooring.condition})
          </li>
          <li>
            <span className="font-medium">Walls</span>: {scan.walls.material}, {scan.walls.colour} ({scan.walls.condition})
          </li>
          <li>
            <span className="font-medium">Ceiling</span>: {scan.ceiling.type}
            {scan.ceiling.notes ? `. ${scan.ceiling.notes}` : ""}
          </li>
        </ul>
      </Section>

      {scan.constraints.length > 0 && (
        <Section icon={TriangleAlert} title="Constraints">
          <ul className="space-y-2">
            {scan.constraints.map((c, i) => (
              <li key={i} className="rounded-lg bg-secondary/60 p-3">
                <p className="font-medium">
                  {CONSTRAINT_LABELS[c.type]} · <span className="font-normal text-muted-foreground">{c.location}</span>
                </p>
                <p>{c.description}</p>
                {c.design_impact && <p className="text-muted-foreground">→ {c.design_impact}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {scan.existing_furniture.length > 0 && (
        <Section icon={Sofa} title="Existing furniture & fixtures">
          <ul className="space-y-1">
            {scan.existing_furniture.map((f, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-2">
                <span className="font-medium">{f.item}</span>
                <Badge variant="outline" className="capitalize">
                  {f.recommendation}
                </Badge>
                <span className="text-muted-foreground">{f.notes}</span>
              </li>
            ))}
          </ul>
          {scan.fixtures.length > 0 && <p className="mt-2 text-muted-foreground">Fixtures: {scan.fixtures.join(" · ")}</p>}
        </Section>
      )}

      {scan.opportunities.length > 0 && (
        <Section icon={Lightbulb} title="Opportunities">
          <ul className="list-disc space-y-1 pl-5">
            {scan.opportunities.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </Section>
      )}
    </article>
  );
}
