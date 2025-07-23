# Custom Hooks

This directory contains reusable custom hooks for the Unhook web application.

## useAutoCreateOrg

A hook that automatically checks if a user has any organizations and creates one if they don't. It also handles auto-selection of organizations when the user has exactly one.

### Usage

```tsx
import { useAutoCreateOrg } from '~/hooks/use-auto-create-org';

function MyComponent() {
  const {
    selectedOrgId,
    isAutoCreating,
    isInitialized,
    userMemberships,
    setSelectedOrgId
  } = useAutoCreateOrg({
    onOrgCreated: (orgId, orgName) => {
      console.log('Organization created:', orgId, orgName);
    },
    onOrgSelected: (orgId) => {
      console.log('Organization selected:', orgId);
    },
    autoCreate: true, // Set to false to disable auto-creation
  });

  if (isAutoCreating) {
    return <div>Creating your organization...</div>;
  }

  return (
    <div>
      {selectedOrgId && <p>Selected org: {selectedOrgId}</p>}
    </div>
  );
}
```

### Options

- `onOrgCreated?: (orgId: string, orgName: string) => void` - Callback when a new organization is created
- `onOrgSelected?: (orgId: string) => void` - Callback when an organization is selected
- `autoCreate?: boolean` - Whether to automatically create an organization if the user has none (default: true)

### Return Values

- `selectedOrgId?: string` - The currently selected organization ID
- `isAutoCreating: boolean` - Whether an organization is currently being created
- `isInitialized: boolean` - Whether the hook has finished its initial setup
- `userMemberships: Array` - Array of user's organization memberships
- `setSelectedOrgId: (orgId: string) => void` - Function to manually set the selected organization

### Behavior

1. **No organizations**: Automatically creates a new organization with a name based on the user's name or email
2. **One organization**: Automatically selects the single organization
3. **Multiple organizations**: Does not auto-select, allows manual selection
4. **Loading states**: Provides loading indicators during organization creation
5. **Error handling**: Shows toast notifications for success/error states
6. **Analytics**: Tracks organization creation events with PostHog

### Integration with Clerk

The hook integrates with Clerk's organization management:
- Uses `useOrganizationList` to get user memberships
- Uses `setActive` to set the active organization
- Automatically switches to the created/selected organization

### Used In

- `apps/web-app/src/app/(app)/app/auth-code/_components/auth-code-content.tsx`
- `apps/web-app/src/app/(app)/app/webhooks/create/_components/webhook-wizard.tsx`