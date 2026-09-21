import { CTA, Features, Hero, HowItWorks } from "@widgets/home";

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
