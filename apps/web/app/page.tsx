import Header from "../components/header";
import Hero from "../components/hero";
import AudienceStrip from "../components/audience-strip";
import ServicesSection from "../components/services-section";
import HowItWorks from "../components/how-it-works";
import FeaturesSection from "../components/features-section";
import PricingSection from "../components/pricing-section";
import Testimonials from "../components/testimonials";
import AboutSection from "../components/about-section";
import ContactSection from "../components/contact-section";
import Footer from "../components/footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />

      {/* Spacer pour le header fixe */}
      <div className="header-spacer"></div>

      <Hero />
      <AudienceStrip />
      <ServicesSection />
      <HowItWorks />
      <FeaturesSection />
      <PricingSection />
      <Testimonials />
      <AboutSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
