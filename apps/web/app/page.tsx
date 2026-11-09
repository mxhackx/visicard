import type { Metadata } from "next";
import Header from "../components/header";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: SITE.title },
  alternates: { canonical: "/" },
};
import Hero from "../components/hero";
import AudienceStrip from "../components/audience-strip";
import DemoSection from "../components/demo-section";
import HowItWorks from "../components/how-it-works";
import FeaturesSection from "../components/features-section";
import Testimonials from "../components/testimonials";
import ExamplesSection from "../components/examples-section";
import PricingSection from "../components/pricing-section";
import ContactSection from "../components/contact-section";
import Footer from "../components/footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />

      {/* Le hero occupe tout l'écran, en-tête compris : pas d'espaceur ici. */}

      <Hero />
      <AudienceStrip />
      <HowItWorks />
      <DemoSection />
      <FeaturesSection />
      <ExamplesSection />
      <PricingSection />
      <Testimonials />
      <ContactSection />
      <Footer />
    </main>
  );
}
