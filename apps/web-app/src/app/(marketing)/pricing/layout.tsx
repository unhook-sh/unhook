import { FooterSection } from '~/app/(marketing)/_components/sections/footer-section';
import { Navbar } from '~/app/(marketing)/_components/sections/navbar';
import { siteConfig } from '~/app/(marketing)/_lib/config';

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar navs={siteConfig.nav.links} />
      <main className="flex flex-col items-center justify-center min-h-screen w-full">
        {children}
        <FooterSection />
      </main>
    </div>
  );
}
