'use client';
import { useState } from 'react';
import { AuthCodeLoginButton } from './auth-code-login-button';
import { OrgSelectorProvider } from './org-selector';

export function AuthCodeContent() {
  const [selectedOrgId, setSelectedOrgId] = useState<string>();

  return (
    <>
      <OrgSelectorProvider
        onSelect={(orgId) => {
          setSelectedOrgId(orgId);
        }}
      />
      {selectedOrgId && <AuthCodeLoginButton />}
    </>
  );
}
