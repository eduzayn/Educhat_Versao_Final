import { HeroSection } from "../sections/HeroSection"
import { ProblemSection } from "../sections/ProblemSection"
import { SolutionSection } from "../sections/SolutionSection"
import { BiSection } from "../sections/BiSection"
import { PricingSection } from "../sections/PricingSection"
import { GuaranteeSection } from "../sections/GuaranteeSection"
import { FinalCTASection } from "../sections/FinalCTASection"
import { Footer } from "../sections/Footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <BiSection />
      <PricingSection />
      <GuaranteeSection />
      <FinalCTASection />
      <Footer />
    </div>
  )
}