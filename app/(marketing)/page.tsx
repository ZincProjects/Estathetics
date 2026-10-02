import Link from "next/link";
import { ArrowRight, Camera, Home, Sparkles, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const pillars = [
  {
    icon: Camera,
    title: "For interior designers",
    body: "Snap a room, get an AI scan of its dimensions and constraints, then explore structure-preserving redesigns in ten themes.",
  },
  {
    icon: Home,
    title: "For property agents",
    body: "Build listings that sell the lifestyle: neighbourhood reports, factual AI copy and a beautiful shareable page.",
  },
  {
    icon: Users,
    title: "The Bridge",
    body: "Invite a designer to virtually stage your listing. Buyers toggle themes, and request a quote for the look they love.",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="container-page grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-brand" /> AI design studio for Singapore homes
          </p>
          <h1 className="text-4xl leading-[1.05] md:text-6xl">
            See the home <em className="text-brand">before</em> you make it yours.
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Estathetics brings interior designers and property agents together, so every family can picture how they
            would live in a space.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup?role=interior_designer" className={buttonVariants({ size: "xl" })}>
              I&apos;m a designer <ArrowRight />
            </Link>
            <Link href="/signup?role=agent" className={buttonVariants({ size: "xl", variant: "outline" })}>
              I&apos;m an agent
            </Link>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mock/hero-after.jpg" alt="A living room virtually staged in Japandi style" className="size-full object-cover" />
          <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
            Virtually staged (AI-generated)
          </span>
        </div>
      </section>

      <section className="border-t border-border/60 bg-secondary/40 py-16">
        <div className="container-page grid gap-8 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, body }) => (
            <div key={title} className="space-y-3">
              <Icon className="size-6 text-brand" />
              <h2 className="text-2xl">{title}</h2>
              <p className="text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
