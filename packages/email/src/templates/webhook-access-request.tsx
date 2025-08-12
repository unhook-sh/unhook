import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export interface WebhookAccessRequestEmailProps {
  requesterName: string;
  requesterEmail: string;
  webhookName: string;
  webhookId: string;
  message?: string;
  approveUrl: string;
  rejectUrl: string;
  dashboardUrl: string;
}

export const WebhookAccessRequestEmail = ({
  requesterName,
  requesterEmail,
  webhookName,
  webhookId,
  message,
  approveUrl,
  rejectUrl,
  dashboardUrl,
}: WebhookAccessRequestEmailProps) => {
  const previewText = `${requesterName} requested access to ${webhookName}`;

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

          <Heading style={h1}>New Webhook Access Request</Heading>

          <Text style={text}>
            <strong>{requesterName}</strong> ({requesterEmail}) has requested
            access to your webhook:
          </Text>

          <Section style={webhookSection}>
            <Text style={webhookNameStyle}>{webhookName}</Text>
            <Text style={webhookIdStyle}>ID: {webhookId}</Text>
          </Section>

          {message && (
            <>
              <Text style={messageLabel}>Message from requester:</Text>
              <Section style={messageSection}>
                <Text style={messageText}>{message}</Text>
              </Section>
            </>
          )}

          <Section style={buttonContainer}>
            <Button href={approveUrl} style={approveButton}>
              Approve Request
            </Button>
            <Button href={rejectUrl} style={rejectButton}>
              Reject Request
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footerText}>
            You can also manage all access requests in your{' '}
            <Link href={dashboardUrl}>Unhook dashboard</Link>.
          </Text>

          <Text style={footerText}>
            This request will expire in 7 days if no action is taken.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WebhookAccessRequestEmail;

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

const webhookSection = {
  backgroundColor: '#f4f4f5',
  borderRadius: '4px',
  margin: '0 48px 24px',
  padding: '16px',
};

const webhookNameStyle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 4px',
};

const webhookIdStyle = {
  color: '#666',
  fontSize: '14px',
  margin: '0',
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

const buttonContainer = {
  marginBottom: '32px',
  padding: '0 48px',
};

const buttonBase = {
  borderRadius: '5px',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  marginRight: '12px',
  padding: '12px 24px',
  textAlign: 'center' as const,
  textDecoration: 'none',
};

const approveButton = {
  ...buttonBase,
  backgroundColor: '#10b981',
  color: '#fff',
};

const rejectButton = {
  ...buttonBase,
  backgroundColor: '#ef4444',
  color: '#fff',
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
