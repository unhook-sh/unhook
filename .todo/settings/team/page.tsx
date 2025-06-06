import { Separator } from '@unhook/ui/separator';
import { MembersSection } from './_components/members-section';

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Team Members</h3>
        <p className="text-sm text-muted-foreground">
          Manage your team members and their permissions.
        </p>
      </div>
      <Separator />
      <MembersSection />
    </div>
  );
}
