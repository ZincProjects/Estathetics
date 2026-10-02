import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article className="container-page max-w-2xl space-y-5 py-12 leading-relaxed [&_h2]:pt-4 [&_h2]:text-2xl">
      <h1 className="text-4xl">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Draft for review. Last updated 2 October 2026.</p>
      <p>
        Estathetics (&ldquo;we&rdquo;) respects your personal data and handles it in line with Singapore&rsquo;s Personal Data
        Protection Act 2012 (PDPA).
      </p>
      <h2>What we collect</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Account details: name, email, phone, role, firm or agency, and CEA registration number for agents.</li>
        <li>Content you upload: room and property photos, listing details, designs and chat messages with our AI designer.</li>
        <li>Enquiries: when you contact an agent or designer, we pass your name, contact details, budget and message to that person, with your consent.</li>
        <li>Usage data, such as AI generation counts, used for rate limiting and billing.</li>
      </ul>
      <h2>How we use it</h2>
      <p>
        To provide the service, to connect buyers with the agents and designers they contact, and to improve the product. Photos you
        upload are sent to our AI providers (Anthropic, and an image-generation provider) only to produce the analysis or designs you
        request.
      </p>
      <h2>AI-generated images</h2>
      <p>
        Every virtually staged image is labelled &ldquo;Virtually staged (AI-generated)&rdquo;, and the original photo always stays
        available.
      </p>
      <h2>Your rights</h2>
      <p>
        You can access and correct your data in Settings, and delete your account and all associated data at any time. To withdraw
        consent or make a request, contact the Data Protection Officer at privacy@estathetics.sg.
      </p>
    </article>
  );
}
