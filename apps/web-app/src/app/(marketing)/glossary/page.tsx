import { FooterSection } from '~/app/(marketing)/_components/sections/footer-section';
import { Navbar } from '~/app/(marketing)/_components/sections/navbar';
import { GlossarySection } from './_components/glossary-section';

export default function GlossaryPage() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <GlossarySection />
        <FooterSection />
      </main>
    </div>
  );
}
