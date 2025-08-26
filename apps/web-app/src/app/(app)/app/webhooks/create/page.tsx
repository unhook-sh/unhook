import { WebhookWizard } from './_components/webhook-wizard';

export default async function WebhooksCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ orgName?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="container grid min-h-screen place-items-center mx-auto">
      <div className="flex w-full max-w-[32rem] flex-col items-center gap-8">
        <WebhookWizard orgName={params.orgName} />
      </div>
    </main>
  );
}
