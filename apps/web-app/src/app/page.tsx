import { H1 } from "@acme/ui/typography";

export default function Page() {
  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <H1>
          <span className="text-primary">On</span>Script
        </H1>
        <div className="flex w-full max-w-2xl flex-col gap-4 overflow-y-scroll">
          <p>Hello</p>
        </div>
      </div>
    </main>
  );
}
