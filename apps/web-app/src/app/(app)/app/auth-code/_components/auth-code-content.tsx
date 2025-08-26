'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { useState } from 'react';
import { AuthCodeLoginButton } from './auth-code-login-button';
import { CloseWindowCard } from './close-wind-card';
import { OrgSelectorProvider } from './org-selector';

export function AuthCodeContent() {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  if (isAuthenticated) {
    return <CloseWindowCard />;
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle>Grant Access</CardTitle>
        <CardDescription>
          Select or create an organization, then click the button below to
          authenticate with Unhook.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <OrgSelectorProvider onSelect={setSelectedOrg} />
        <AuthCodeLoginButton
          disabled={!selectedOrg}
          onSuccess={handleAuthSuccess}
        />
      </CardContent>
    </Card>
  );
}
