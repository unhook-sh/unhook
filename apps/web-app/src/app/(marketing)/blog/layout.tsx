import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';
import { siteConfig } from '../_lib/config';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: MarketingLayoutProps) {
  return (
    <>
      <Navbar navs={siteConfig.nav.links} />
      <main>{children}</main>
      <FooterSection />
    </>
  );
}
