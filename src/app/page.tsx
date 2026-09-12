import { FieldProvider } from "@/components/field/FieldProvider";
import { FieldSection } from "@/components/field/FieldSection";
import { FindSection } from "@/components/landing/FindSection";
import { JoinPanel } from "@/components/landing/JoinPanel";
import { Loader } from "@/components/landing/Loader";
import { Nav } from "@/components/landing/Nav";
import { ProgressiveBlur } from "@/components/landing/ProgressiveBlur";
import {
  Footer,
  OpenSourceSection,
  OrganizationsSection,
  PreEventSection,
} from "@/components/landing/Sections";

export default function HomePage() {
  return (
    <FieldProvider>
      <Loader />
      <ProgressiveBlur side="top" />
      <ProgressiveBlur side="bottom" />
      <Nav />

      <main className="relative z-10 flex flex-1 flex-col">
        {/* Hero. Centred, because a field moment is symmetric about its waist,
            and the type sits at the convergence point — form.md §6. */}
        <FieldSection
          from={0.25}
          className="flex min-h-dvh flex-col items-center justify-center gap-10 px-5 py-28"
        >
          <h1 className="display-xl text-ink text-center">Converge</h1>
          <JoinPanel />
          <p className="body-s text-ink-3 text-center">
            Got a link? Just open it — you won&rsquo;t need a code.
          </p>
        </FieldSection>

        <FindSection />
        <PreEventSection />
        <OrganizationsSection />
        <OpenSourceSection />
        <Footer />
      </main>
    </FieldProvider>
  );
}
