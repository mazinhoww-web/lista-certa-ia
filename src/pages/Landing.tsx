import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ProconBanner } from "@/components/landing/ProconBanner";
import { RetailersMarquee } from "@/components/landing/RetailersMarquee";
import { ForSchools } from "@/components/landing/ForSchools";
import { Footer } from "@/components/landing/Footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-lc-surface">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <ProconBanner />
        <RetailersMarquee />
        <ForSchools />
      </main>
      <Footer />
    </div>
  );
}