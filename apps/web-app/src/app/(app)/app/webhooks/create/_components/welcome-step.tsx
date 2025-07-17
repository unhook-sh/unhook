import { OrgSelector } from '~/app/(app)/app/auth-code/_components/org-selector';

interface WelcomeStepProps {
  onChange: (value: string) => void;
}

export function WelcomeStep({ onChange }: WelcomeStepProps) {
  return <OrgSelector onSelect={onChange} />;
}
