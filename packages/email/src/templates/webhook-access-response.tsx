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
              src="https://unhook.sh/logo.png"
              width="120"
              height="36"
              alt="Unhook"
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
                  <Button style={primaryButton} href={dashboardUrl}>
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
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '5px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const logoContainer = {
  padding: '20px 48px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0 48px',
  marginBottom: '24px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  padding: '0 48px',
  marginBottom: '16px',
};

const messageLabel = {
  color: '#666',
  fontSize: '14px',
  padding: '0 48px',
  marginBottom: '8px',
};

const messageSection = {
  backgroundColor: '#f9fafb',
  borderRadius: '4px',
  margin: '0 48px 24px',
  padding: '16px',
  borderLeft: '4px solid #3b82f6',
};

const messageText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const successSection = {
  backgroundColor: '#f0fdf4',
  borderRadius: '4px',
  margin: '0 48px 24px',
  padding: '20px',
  borderLeft: '4px solid #10b981',
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
  borderRadius: '4px',
  margin: '0 48px 24px',
  padding: '20px',
  borderLeft: '4px solid #ef4444',
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
  color: '#e2e8f0',
  padding: '12px 16px',
  borderRadius: '4px',
  fontSize: '14px',
  fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
  display: 'block',
  overflow: 'auto',
};

const buttonContainer = {
  padding: '0 48px',
  marginBottom: '32px',
};

const primaryButton = {
  backgroundColor: '#3b82f6',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 48px',
};

const footerText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  padding: '0 48px',
  marginBottom: '8px',
};
