import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <article className="container-page max-w-2xl space-y-5 py-12 leading-relaxed [&_h2]:pt-4 [&_h2]:text-2xl">
      <h1 className="text-4xl">Terms of Use</h1>
      <p className="text-sm text-muted-foreground">Draft for review. Last updated 2 October 2026.</p>
      <h2>AI output</h2>
      <p>
        Room scans, dimensions, budgets and redesigns are AI-generated estimates. Always verify dimensions on site. Budgets are
        indicative only and are not quotations.
      </p>
      <h2>Property advertising</h2>
      <p>
        Agents are responsible for making sure their listings comply with CEA guidelines, including showing their registration
        number and not presenting virtually staged images as the actual condition of a property.
      </p>
      <h2>Your content</h2>
      <p>
        You keep ownership of the photos and content you upload. You grant us a licence to process them so we can provide the
        service.
      </p>
    </article>
  );
}
