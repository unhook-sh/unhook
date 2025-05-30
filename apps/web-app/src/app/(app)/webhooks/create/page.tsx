import Image from 'next/image';
import { WebhookWizard } from './_components/webhook-wizard';

export default function WebhooksCreatePage() {
  return (
    <main className="container grid min-h-screen place-items-center mx-auto">
      <div className="flex w-full max-w-[32rem] flex-col items-center gap-8">
        <div className="flex items-center flex-col">
          <Image
            src="/logo.svg"
            alt="Unhook Logo"
            width={120}
            height={40}
            priority
            className="h-32 w-auto"
          />
          <div className="text-2xl font-bold">Unhook</div>
        </div>
        <WebhookWizard />
      </div>
    </main>
  );
}
