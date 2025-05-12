import { H4, P } from '@unhook/ui/custom/typography';

export function WelcomeStep() {
  return (
    <div className="space-y-2">
      <H4>Welcome to Unhook</H4>
      <P>
        Unhook helps you receive webhooks locally during development. Let's set
        up your first webhook in a few simple steps.
      </P>
      <P>
        You'll need to provide some basic information about your webhook source
        and destination. We'll guide you through each step.
      </P>
    </div>
  );
}
