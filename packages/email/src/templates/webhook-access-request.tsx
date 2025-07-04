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
              src="https://unhook.sh/logo.png"
              width="120"
              height="36"
              alt="Unhook"
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
            <Button style={approveButton} href={approveUrl}>
              Approve Request
            </Button>
            <Button style={rejectButton} href={rejectUrl}>
              Reject Request
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footerText}>
            You can also manage all access requests in your{' '}
            <Link href={dashboardUrl} style={link}>
              Unhook dashboard
            </Link>
            .
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

const buttonContainer = {
  padding: '0 48px',
  marginBottom: '32px',
};

const buttonBase = {
  borderRadius: '5px',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  marginRight: '12px',
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
  padding: '0 48px',
  marginBottom: '8px',
};

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
};
