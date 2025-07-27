import { Suspense } from 'react';
import { AuthCodeContent } from './_components/auth-code-content';
import { SignInDifferentAccountButton } from './_components/sign-in-different-account-button';

export default function Page() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center w-full">
      <AuthCodeContent />
      <Suspense>
        <SignInDifferentAccountButton />
      </Suspense>
    </div>
  );
}
