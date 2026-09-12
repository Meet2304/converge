import { FieldProvider } from "@/components/field/FieldProvider";
import { FindSection } from "@/components/landing/FindSection";
import { Hero } from "@/components/landing/Hero";
import { Loader } from "@/components/landing/Loader";
import { LookingSection } from "@/components/landing/LookingSection";
import { Nav } from "@/components/landing/Nav";
import { ProgressiveBlur } from "@/components/landing/ProgressiveBlur";
import { Footer, OpenSourceSection, OrganizersSection } from "@/components/landing/Sections";

export default function HomePage() {
  return (
    <FieldProvider>
      <Loader />
      <ProgressiveBlur side="top" />
      <ProgressiveBlur side="bottom" />
      <Nav />

      <main className="relative z-10 flex flex-1 flex-col">
        <Hero />
        <FindSection />
        <LookingSection />
        <OrganizersSection />
        <OpenSourceSection />
        <Footer />
      </main>
    </FieldProvider>
  );
}
