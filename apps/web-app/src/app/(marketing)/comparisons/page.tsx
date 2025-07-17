import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';
import { ComparisonsContent } from './_components/comparisons-content';

export const metadata = {
  description:
    'Compare Unhook with ngrok, Webhook.site, Beeceptor, Localtunnel and other webhook testing tools. See why teams choose Unhook for better collaboration and VS Code integration.',
  keywords: [
    'webhook testing comparison',
    'ngrok vs unhook',
    'webhook.site alternative',
    'beeceptor alternative',
    'webhook testing tools',
  ],
  title: 'Unhook vs Competitors: Webhook Testing Tool Comparisons | Unhook',
};

export default function ComparisonsPage() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar />
      <ComparisonsContent />
      <FooterSection />
    </div>
  );
}
