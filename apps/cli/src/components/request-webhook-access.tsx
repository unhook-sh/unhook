import { api } from '@unhook/api/react';
import { debug } from '@unhook/logger';
import { Box, Text, useInput } from 'ink';
import { type FC, useState } from 'react';
import { Spinner } from './spinner';
import { TextInput } from './text-input';

const log = debug('unhook:cli:request-webhook-access');

interface RequestWebhookAccessProps {
  webhookUrl: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const RequestWebhookAccess: FC<RequestWebhookAccessProps> = ({
  webhookUrl,
  onSuccess,
  onCancel,
}) => {
  const [message, setMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);

  const checkPendingRequest =
    api.webhookAccessRequests.checkPendingRequest.useQuery({
      webhookUrl,
    });

  const createRequest = api.webhookAccessRequests.create.useMutation({
    onError: (error) => {
      log('Error creating access request:', error);
    },
    onSuccess: () => {
      log('Access request created successfully');
      onSuccess?.();
    },
  });

  useInput((input, key) => {
    if (
      !showMessageInput &&
      !createRequest.isPending &&
      !createRequest.isSuccess
    ) {
      if (input === 'r') {
        handleRequestAccess();
      } else if (input === 'q') {
        if (onCancel) {
          onCancel();
        } else {
          process.exit(0);
        }
      }
    }

    if (createRequest.isError) {
      if (input === 'r') {
        createRequest.reset();
      } else if (input === 'q') {
        if (onCancel) {
          onCancel();
        } else {
          process.exit(0);
        }
      }
    }

    if (key.escape && showMessageInput) {
      handleCancel();
    }
  });

  const handleRequestAccess = () => {
    setShowMessageInput(true);
  };

  const handleSubmitRequest = () => {
    createRequest.mutate({
      requesterMessage: message || undefined,
      webhookUrl,
    });
  };

  const handleCancel = () => {
    if (showMessageInput) {
      setShowMessageInput(false);
      setMessage('');
    } else {
      onCancel?.();
    }
  };

  if (checkPendingRequest.isLoading) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text>
          <Spinner type="dots" /> Checking access request status...
        </Text>
      </Box>
    );
  }

  if (checkPendingRequest.data) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text color="yellow">⏳ Access Request Pending</Text>
        <Text>
          You have already requested access to this webhook. Your request is
          pending approval.
        </Text>
        {checkPendingRequest.data.requesterMessage && (
          <Box marginTop={1}>
            <Text dimColor>
              Your message: {checkPendingRequest.data.requesterMessage}
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  if (createRequest.isPending) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text>
          <Spinner type="dots" /> Sending access request...
        </Text>
      </Box>
    );
  }

  if (createRequest.isSuccess) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text color="green">✓ Access Request Sent</Text>
        <Text>
          Your request has been sent to the webhook owner. You'll be notified
          once they respond.
        </Text>
      </Box>
    );
  }

  if (createRequest.isError) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text color="red">✗ Failed to Send Request</Text>
        <Text color="red">{createRequest.error?.message}</Text>
        <Box marginTop={1}>
          <Text dimColor>Press 'r' to retry or 'q' to quit</Text>
        </Box>
      </Box>
    );
  }

  if (showMessageInput) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>Request Access to Webhook</Text>
        <Text dimColor>
          Add an optional message to help the webhook owner understand why you
          need access:
        </Text>
        <Box marginTop={1}>
          <TextInput
            onChange={setMessage}
            onSubmit={handleSubmitRequest}
            placeholder="e.g., I'm working on the payment integration feature..."
            value={message}
          />
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press Enter to send request or Escape to cancel</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Text color="yellow">⚠️ Access Denied</Text>
      <Text>You don't have access to this webhook.</Text>
      <Box marginTop={1}>
        <Text dimColor>Press 'r' to request access or 'q' to quit</Text>
      </Box>
    </Box>
  );
};
