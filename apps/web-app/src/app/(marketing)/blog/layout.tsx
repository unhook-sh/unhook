import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: MarketingLayoutProps) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <FooterSection />
    </>
  );
}
