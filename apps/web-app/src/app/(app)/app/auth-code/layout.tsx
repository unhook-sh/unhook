import Image from 'next/image';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="container grid min-h-screen place-items-center mx-auto">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
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
        {children}
      </div>
    </main>
  );
}
