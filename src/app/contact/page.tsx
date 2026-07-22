import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { siteUrl } from "@/lib/site";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Contact | CutLab Studio",
  description: "Contact CutLab Studio for product support, account help, privacy requests, or business inquiries.",
  alternates: {
    canonical: "/contact"
  }
};

export default function ContactRoute() {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact CutLab Studio",
    url: `${siteUrl}/contact`,
    mainEntity: {
      "@type": "Organization",
      name: "CutLab Studio",
      email: "Cutlab.Studios@gmail.com",
      url: siteUrl
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema).replace(/</g, "\\u003c") }} />
      <LegalPage
        title="Contact CutLab Studio"
        updatedAt="July 22, 2026"
        intro="Get help with the product, your account, privacy requests, or a business inquiry. We review messages sent to the address below."
        sections={[
          {
            title: "Email",
            body: (
              <p>
                Email us directly at{" "}
                <a href="mailto:Cutlab.Studios@gmail.com">Cutlab.Studios@gmail.com</a>.
              </p>
            )
          },
          {
            title: "Send A Message",
            body: <ContactForm />
          },
          {
            title: "Response Expectations",
            body: <p>Include the page or feature involved, what you expected, and what happened. Please do not send passwords, API keys, private client files, or payment details.</p>
          }
        ]}
      />
    </>
  );
}
