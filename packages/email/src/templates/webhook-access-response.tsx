import 'server-only';

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export interface WebhookAccessResponseEmailProps {
  requesterName: string;
  webhookName: string;
  webhookId: string;
  status: 'approved' | 'rejected';
  responseMessage?: string;
  dashboardUrl?: string;
  cliCommand?: string;
}

export const WebhookAccessResponseEmail = ({
  requesterName,
  webhookName,
  webhookId: _webhookId,
  status,
  responseMessage,
  dashboardUrl,
  cliCommand,
}: WebhookAccessResponseEmailProps) => {
  const isApproved = status === 'approved';
  const previewText = `Your access request for ${webhookName} has been ${status}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              alt="Unhook"
              height="36"
              src="https://unhook.sh/logo.png"
              width="120"
            />
          </Section>

          <Heading style={h1}>
            Access Request {isApproved ? 'Approved' : 'Rejected'}
          </Heading>

          <Text style={text}>Hi {requesterName},</Text>

          <Text style={text}>
            Your request to access the webhook <strong>{webhookName}</strong>{' '}
            has been{' '}
            <strong style={{ color: isApproved ? '#10b981' : '#ef4444' }}>
              {status}
            </strong>
            .
          </Text>

          {responseMessage && (
            <>
              <Text style={messageLabel}>Message from the webhook owner:</Text>
              <Section style={messageSection}>
                <Text style={messageText}>{responseMessage}</Text>
              </Section>
            </>
          )}

          {isApproved && (
            <>
              <Section style={successSection}>
                <Text style={successTitle}>🎉 You now have access!</Text>
                <Text style={successText}>
                  You can now use this webhook in your development workflow.
                </Text>
              </Section>

              {cliCommand && (
                <Section style={codeSection}>
                  <Text style={codeLabel}>To get started, run:</Text>
                  <code style={codeBlock}>{cliCommand}</code>
                </Section>
              )}

              {dashboardUrl && (
                <Section style={buttonContainer}>
                  <Button href={dashboardUrl} style={primaryButton}>
                    Go to Dashboard
                  </Button>
                </Section>
              )}
            </>
          )}

          {!isApproved && (
            <Section style={rejectionSection}>
              <Text style={rejectionText}>
                If you believe this was a mistake or need further clarification,
                please contact the webhook owner directly.
              </Text>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footerText}>
            This is an automated message from Unhook. Please do not reply to
            this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WebhookAccessResponseEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  borderRadius: '5px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  margin: '0 auto',
  marginBottom: '64px',
  padding: '20px 0 48px',
};

const logoContainer = {
  padding: '20px 48px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  marginBottom: '24px',
  padding: '0 48px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '16px',
  padding: '0 48px',
};

const messageLabel = {
  color: '#666',
  fontSize: '14px',
  marginBottom: '8px',
  padding: '0 48px',
};

const messageSection = {
  backgroundColor: '#f9fafb',
  borderLeft: '4px solid #3b82f6',
  borderRadius: '4px',
  margin: '0 48px 24px',
  padding: '16px',
};

const messageText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const successSection = {
  backgroundColor: '#f0fdf4',
  borderLeft: '4px solid #10b981',
  borderRadius: '4px',
  margin: '0 48px 24px',
  padding: '20px',
};

const successTitle = {
  color: '#065f46',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const successText = {
  color: '#047857',
  fontSize: '14px',
  margin: '0',
};

const rejectionSection = {
  backgroundColor: '#fef2f2',
  borderLeft: '4px solid #ef4444',
  borderRadius: '4px',
  margin: '0 48px 24px',
  padding: '20px',
};

const rejectionText = {
  color: '#991b1b',
  fontSize: '14px',
  margin: '0',
};

const codeSection = {
  margin: '0 48px 24px',
};

const codeLabel = {
  color: '#666',
  fontSize: '14px',
  marginBottom: '8px',
};

const codeBlock = {
  backgroundColor: '#1e293b',
  borderRadius: '4px',
  color: '#e2e8f0',
  display: 'block',
  fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
  fontSize: '14px',
  overflow: 'auto',
  padding: '12px 16px',
};

const buttonContainer = {
  marginBottom: '32px',
  padding: '0 48px',
};

const primaryButton = {
  backgroundColor: '#3b82f6',
  borderRadius: '5px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 24px',
  textAlign: 'center' as const,
  textDecoration: 'none',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 48px',
};

const footerText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  marginBottom: '8px',
  padding: '0 48px',
};
