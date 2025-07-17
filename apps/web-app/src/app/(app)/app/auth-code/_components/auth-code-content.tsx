'use client';
import { useState } from 'react';
import { CliLoginButton } from './cli-login-button';
import { OrgSelectorProvider } from './org-selector';

export function CliTokenContent() {
  const [selectedOrgId, setSelectedOrgId] = useState<string>();

  return (
    <>
      <OrgSelectorProvider
        onSelect={(orgId) => {
          setSelectedOrgId(orgId);
        }}
      />
      {selectedOrgId && <CliLoginButton />}
    </>
  );
}
