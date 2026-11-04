import Header from "../components/header";
import Hero from "../components/hero";
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
      <div className="h-16"></div>

      <Hero />
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
