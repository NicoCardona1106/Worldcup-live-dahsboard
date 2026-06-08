import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import MatchesSection from "@/components/MatchesSection";
import StandingsSection from "@/components/StandingsSection";
import BracketSection from "@/components/BracketSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import AIAssistant from "@/components/AIAssistant";

export default function Home() {
  return (
    <>
      <div className="grain-overlay" />
      <Navbar />
      <main>
        <Hero />
        <MatchesSection />
        <StandingsSection />
        <BracketSection />
        <CTASection />
      </main>
      <Footer />
      <AIAssistant />
    </>
  );
}
