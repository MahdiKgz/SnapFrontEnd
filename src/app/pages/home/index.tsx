import React from "react";

import CTA from "@/widgets/home/ui/CTA";
import Features from "@/widgets/home/ui/Features";
import Hero from "@/widgets/home/ui/Hero";
import HowItWorks from "@/widgets/home/ui/HowItWorks";

function Home() {
  return (
    <div className="w-full h-full">
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
    </div>
  );
}

export default Home;
