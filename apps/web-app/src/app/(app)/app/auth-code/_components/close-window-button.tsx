'use client';
import { MetricButton } from '@unhook/analytics/components';

export function CloseWindowButton() {
  return (
    <MetricButton
      autoFocus
      metric="auth_code_success_close_window_clicked"
      onClick={() => window.close()}
    >
      Close
    </MetricButton>
  );
}
