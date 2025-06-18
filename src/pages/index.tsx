import { HeroSection } from "../HeroSection"
import { ProblemSection } from "../ProblemSection"
import { SolutionSection } from "../SolutionSection"
import { BiSection } from "../BiSection"
import { PricingSection } from "../PricingSection"
import { GuaranteeSection } from "../GuaranteeSection"
import { FinalCTASection } from "../FinalCTASection"
import { Footer } from "../Footer"

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