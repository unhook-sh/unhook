export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="container grid min-h-screen place-items-center mx-auto">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        {children}
      </div>
    </main>
  );
}
