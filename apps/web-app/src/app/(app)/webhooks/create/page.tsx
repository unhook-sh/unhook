import { auth } from '@clerk/nextjs/server';
import Image from 'next/image';
import { WebhookWizard } from './_components/webhook-wizard';

export default async function WebhooksCreatePage() {
  const { userId, getToken } = await auth();
  const authToken = userId ? await getToken({ template: 'supabase' }) : null;

  return (
    <main className="container grid min-h-screen place-items-center mx-auto">
      <div className="flex w-full max-w-[32rem] flex-col items-center gap-8">
        <div className="flex items-center flex-col">
          <Image
            alt="Unhook Logo"
            className="h-32 w-auto"
            height={40}
            priority
            src="/logo.svg"
            width={120}
          />
          <div className="text-2xl font-bold">Unhook</div>
        </div>
        <WebhookWizard authToken={authToken ?? undefined} />
      </div>
    </main>
  );
}
