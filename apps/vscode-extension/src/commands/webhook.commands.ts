import * as vscode from 'vscode';
import type { AnalyticsService } from '../services/analytics.service';
import type { AuthStore } from '../services/auth.service';
import { createConfigContentWithSpecificWebhookId } from '../utils/config-templates';

export function registerWebhookCommands(
  context: vscode.ExtensionContext,
  authStore: AuthStore,
  analyticsService?: AnalyticsService,
) {
  const createWebhookCommand = vscode.commands.registerCommand(
    'unhook.createWebhook',
    async (autoCreateConfig = false) => {
      // Check if user is signed in
      if (!authStore.isSignedIn) {
        vscode.window.showErrorMessage(
          'Please sign in to Unhook before creating a webhook.',
        );
        return;
      }

      // Get the workspace folder
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage(
          'Please open a workspace folder before creating a webhook.',
        );
        return;
      }

      // Choose the workspace folder if there are multiple
      let targetFolder: vscode.WorkspaceFolder | undefined;
      if (workspaceFolders.length === 1) {
        targetFolder = workspaceFolders[0];
      } else {
        const folderPick = await vscode.window.showQuickPick(
          workspaceFolders.map((folder) => ({
            description: folder.uri.fsPath,
            folder,
            label: folder.name,
          })),
          {
            placeHolder: 'Select workspace folder',
          },
        );

        if (!folderPick) {
          return;
        }
        targetFolder = folderPick.folder;
      }

      if (!targetFolder) {
        return;
      }

      // Prompt for webhook name
      const webhookName = await vscode.window.showInputBox({
        placeHolder: 'Enter webhook name (e.g., "My Webhook")',
        prompt: 'What would you like to name your webhook?',
        value: 'My Webhook',
      });

      if (!webhookName) {
        return;
      }

      try {
        // Show progress indicator
        await vscode.window.withProgress(
          {
            cancellable: false,
            location: vscode.ProgressLocation.Notification,
            title: 'Creating webhook...',
          },
          async () => {
            // Get API keys to use for the webhook
            console.log('Fetching API keys...');
            console.log('Auth store state:', {
              authToken: authStore.authToken,
              isSignedIn: authStore.isSignedIn,
              sessionId: authStore.sessionId,
            });

            let apiKeys = await authStore.api.apiKeys.all.query();
            console.log('API keys response:', apiKeys);

            if (!apiKeys || apiKeys.length === 0) {
              console.log('No API keys found, attempting to diagnose...');

              // Try to get more detailed error information
              try {
                // Check if we can access other API endpoints
                console.log(
                  'Testing auth with session ID:',
                  authStore.sessionId,
                );
                const testQuery =
                  await authStore.api.auth.verifySessionToken.query({
                    sessionId: authStore.sessionId || '',
                    sessionTemplate: 'cli',
                  });
                console.log('Auth test successful:', testQuery);

                // If auth works but no API keys, offer to create one automatically
                const createApiKey = await vscode.window.showInformationMessage(
                  'No API keys found. Would you like to create one automatically?',
                  'Yes, Create API Key',
                  "No, I'll create one manually",
                );

                if (createApiKey === 'Yes, Create API Key') {
                  console.log('Creating API key automatically...');
                  try {
                    const newApiKey = await authStore.api.apiKeys.create.mutate(
                      {
                        isActive: true,
                        name: 'VS Code Extension - Auto Generated',
                      },
                    );

                    if (newApiKey) {
                      console.log(
                        'API key created successfully:',
                        newApiKey.id,
                      );
                      // Use the newly created API key
                      apiKeys = [newApiKey];
                    } else {
                      throw new Error(
                        'API key creation returned null/undefined',
                      );
                    }
                  } catch (createError) {
                    console.error(
                      'Failed to create API key automatically:',
                      createError,
                    );
                    throw new Error(
                      `Failed to create API key automatically: ${createError instanceof Error ? createError.message : 'Unknown error'}. Please create one manually at https://unhook.sh/app/api-keys`,
                    );
                  }
                } else {
                  throw new Error(
                    'No API keys found. Please create an API key at https://unhook.sh/app/api-keys first.',
                  );
                }
              } catch (authError) {
                console.error('Auth test failed:', authError);

                // Try a different approach - check if it's an API key specific issue
                try {
                  console.log(
                    'Trying to access webhooks endpoint as alternative test...',
                  );
                  const webhooksTest = await authStore.api.webhooks.all.query();
                  console.log('Webhooks test successful:', webhooksTest);

                  // If webhooks work but API keys don't, there might be a specific issue
                  throw new Error(
                    'API key access issue detected. Please check your permissions or create an API key manually at https://unhook.sh/app/api-keys',
                  );
                } catch (webhookError) {
                  console.error('Webhooks test also failed:', webhookError);
                  throw new Error(
                    'Authentication failed or no API keys found. Please ensure you are signed in and have created an API key.',
                  );
                }
              }
            }

            // Use the first available API key
            const apiKey = apiKeys[0];
            if (!apiKey) {
              throw new Error('Failed to get API key - no API keys available');
            }

            if (!apiKey.id) {
              throw new Error('API key is missing ID field');
            }

            console.log('Using API key:', apiKey.id);
            console.log(
              'Full API key object:',
              JSON.stringify(apiKey, null, 2),
            );

            // Create the webhook
            console.log('Creating webhook with payload:', {
              apiKeyId: apiKey.id,
              name: webhookName,
              status: 'active',
            });

            // Double-check the API key exists before creating webhook
            try {
              const apiKeyVerification = await authStore.api.apiKeys.byId.query(
                {
                  id: apiKey.id,
                },
              );
              console.log('API key verification result:', apiKeyVerification);

              if (!apiKeyVerification) {
                throw new Error(
                  `API key ${apiKey.id} not found during verification`,
                );
              }
            } catch (verificationError) {
              console.error('API key verification failed:', verificationError);
              throw new Error(
                `API key verification failed: ${verificationError instanceof Error ? verificationError.message : 'Unknown error'}`,
              );
            }

            const webhook = await authStore.api.webhooks.create.mutate({
              apiKeyId: apiKey.id,
              config: {
                headers: {},
                requests: {},
                storage: {
                  maxRequestBodySize: 1024 * 1024, // 1MB
                  maxResponseBodySize: 1024 * 1024, // 1MB
                  storeHeaders: true,
                  storeRequestBody: true,
                  storeResponseBody: true,
                },
              },
              name: webhookName,
              status: 'active',
            });

            if (!webhook) {
              throw new Error('Webhook creation returned null/undefined');
            }

            if (!webhook.id) {
              throw new Error('Created webhook is missing ID field');
            }

            console.log('Webhook created successfully:', webhook);

            // Track successful webhook creation
            analyticsService?.track('webhook_created', {
              webhook_id: webhook.id,
              webhook_name: webhookName,
              workspace: targetFolder.name,
            });

            // Show success message with webhook URL
            const webhookUrl = `https://unhook.sh/${webhook.id}`;

            // Check if user already has a config file
            const hasConfigFile =
              await checkForExistingConfigFile(targetFolder);

            let result: string | undefined;

            if (autoCreateConfig && !hasConfigFile) {
              // Automatically create config file when triggered from workspace config creation flow
              result = 'Create Config';
              vscode.window.showInformationMessage(
                `Webhook "${webhookName}" created successfully! Automatically creating configuration file...`,
              );
            } else if (hasConfigFile) {
              // User has config file, offer to update it
              result = await vscode.window.showInformationMessage(
                `Webhook "${webhookName}" created successfully!`,
                'Copy URL',
                'Update Config',
                'Both',
              );
            } else {
              // User doesn't have config file, offer to create it
              result = await vscode.window.showInformationMessage(
                `Webhook "${webhookName}" created successfully!`,
                'Copy URL',
                'Create Config',
                'Both',
              );
            }

            if (result === 'Copy URL' || result === 'Both') {
              await vscode.env.clipboard.writeText(webhookUrl);
              vscode.window.showInformationMessage(
                'Webhook URL copied to clipboard!',
              );
            }

            if (
              result === 'Update Config' ||
              result === 'Create Config' ||
              result === 'Both'
            ) {
              await updateOrCreateConfigFile(
                targetFolder,
                webhook.id,
                authStore,
                analyticsService,
              );
            }

            // Show webhook details
            vscode.window.showInformationMessage(
              `Webhook ID: ${webhook.id}\nURL: ${webhookUrl}`,
            );
          },
        );
      } catch (error) {
        console.error('Failed to create webhook:', error);

        // Track webhook creation failure
        analyticsService?.track('webhook_creation_failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          webhook_name: webhookName,
          workspace: targetFolder.name,
        });

        // Show the main error message
        vscode.window.showErrorMessage(
          `Failed to create webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );

        // Show troubleshooting guide for better user experience
        if (error instanceof Error) {
          await showTroubleshootingGuide(error);
        }
      }
    },
  );

  context.subscriptions.push(createWebhookCommand);
}

// Helper function to provide troubleshooting guidance
async function showTroubleshootingGuide(error: Error): Promise<void> {
  const message = `Webhook creation failed: ${error.message}

Troubleshooting steps:
1. Check if you have API keys: Run "Unhook: Check API Key Status"
2. Create an API key if needed: Run "Unhook: Create New API Key"
3. Ensure you're signed in to Unhook
4. Check the Developer Console for detailed error logs

Would you like to check your API key status now?`;

  const result = await vscode.window.showInformationMessage(
    message,
    'Check API Key Status',
    'Create API Key',
    'Open Developer Console',
    'Dismiss',
  );

  switch (result) {
    case 'Check API Key Status':
      await vscode.commands.executeCommand('unhook.checkApiKeyStatus');
      break;
    case 'Create API Key':
      await vscode.commands.executeCommand('unhook.createApiKey');
      break;
    case 'Open Developer Console':
      await vscode.commands.executeCommand('workbench.action.toggleDevTools');
      break;
  }
}

// Helper function to check if a config file already exists
async function checkForExistingConfigFile(
  targetFolder: vscode.WorkspaceFolder,
): Promise<boolean> {
  const configFiles = [
    'unhook.yml',
    'unhook.yaml',
    'unhook.json',
    'unhook.js',
    'unhook.ts',
    'unhook.config.yml',
    'unhook.config.yaml',
    'unhook.config.json',
    'unhook.config.js',
    'unhook.config.ts',
  ];

  for (const filename of configFiles) {
    try {
      const configUri = vscode.Uri.joinPath(targetFolder.uri, filename);
      await vscode.workspace.fs.stat(configUri);
      return true; // Found at least one existing config file
    } catch {
      // File doesn't exist, continue checking
    }
  }
  return false; // No existing config files found
}

async function updateOrCreateConfigFile(
  targetFolder: vscode.WorkspaceFolder,
  webhookId: string,
  authStore: AuthStore,
  analyticsService?: AnalyticsService,
): Promise<void> {
  const configFiles = [
    'unhook.yml',
    'unhook.yaml',
    'unhook.json',
    'unhook.js',
    'unhook.ts',
    'unhook.config.yml',
    'unhook.config.yaml',
    'unhook.config.json',
    'unhook.config.js',
    'unhook.config.ts',
  ];

  // Check for existing config files
  let existingConfigFile: string | undefined;
  for (const filename of configFiles) {
    try {
      const configUri = vscode.Uri.joinPath(targetFolder.uri, filename);
      await vscode.workspace.fs.stat(configUri);
      existingConfigFile = filename;
      break;
    } catch {
      // File doesn't exist, continue checking
    }
  }

  if (existingConfigFile) {
    // Ask if user wants to update existing config
    const updateChoice = await vscode.window.showQuickPick(
      [
        {
          description: `Update ${existingConfigFile}`,
          label: 'Update existing config',
        },
        { description: 'Create unhook.yml', label: 'Create new config' },
        { description: "Don't update config", label: 'Skip' },
      ],
      {
        placeHolder: 'Choose how to handle configuration',
      },
    );

    if (!updateChoice || updateChoice.label === 'Skip') {
      return;
    }

    if (updateChoice.label === 'Update existing config') {
      await updateExistingConfigFile(
        targetFolder,
        existingConfigFile,
        webhookId,
        analyticsService,
      );
    } else if (updateChoice.label === 'Create new config') {
      await createNewConfigFile(
        targetFolder,
        webhookId,
        authStore,
        analyticsService,
      );
    }
  } else {
    // No existing config, create new one
    await createNewConfigFile(
      targetFolder,
      webhookId,
      authStore,
      analyticsService,
    );
  }
}

async function updateExistingConfigFile(
  targetFolder: vscode.WorkspaceFolder,
  filename: string,
  webhookId: string,
  analyticsService?: AnalyticsService,
): Promise<void> {
  try {
    const configUri = vscode.Uri.joinPath(targetFolder.uri, filename);
    const document = await vscode.workspace.openTextDocument(configUri);

    // Simple update: replace the webhookId line if it exists
    let content = document.getText();
    const webhookIdRegex = /^webhookId:\s*.+$/m;

    if (webhookIdRegex.test(content)) {
      content = content.replace(webhookIdRegex, `webhookId: ${webhookId}`);
    } else {
      // Add webhookId at the beginning if it doesn't exist
      content = `webhookId: ${webhookId}\n\n${content}`;
    }

    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      configUri,
      new vscode.Range(0, 0, document.lineCount, 0),
      content,
    );

    await vscode.workspace.applyEdit(edit);
    await document.save();

    // Track config update
    analyticsService?.track('config_file_updated', {
      filename,
      webhook_id: webhookId,
      workspace: targetFolder.name,
    });

    vscode.window.showInformationMessage(
      `Updated ${filename} with new webhook ID: ${webhookId}`,
    );
  } catch (error) {
    console.error('Failed to update config file:', error);
    vscode.window.showErrorMessage(
      `Failed to update configuration file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

async function createNewConfigFile(
  targetFolder: vscode.WorkspaceFolder,
  webhookId: string,
  _authStore: AuthStore,
  analyticsService?: AnalyticsService,
): Promise<void> {
  const filename = 'unhook.yml';
  const configUri = vscode.Uri.joinPath(targetFolder.uri, filename);

  try {
    // Create the configuration content with the new webhook ID
    const configContent = createConfigContentWithSpecificWebhookId(webhookId);

    const encoder = new TextEncoder();
    await vscode.workspace.fs.writeFile(
      configUri,
      encoder.encode(configContent),
    );

    // Open the created file
    const document = await vscode.workspace.openTextDocument(configUri);
    await vscode.window.showTextDocument(document);

    // Track config file creation
    analyticsService?.track('config_file_created', {
      filename,
      has_webhook_id: true,
      webhook_id: webhookId,
      workspace: targetFolder.name,
    });

    vscode.window.showInformationMessage(
      `Created ${filename} in ${targetFolder.name} with webhook ID: ${webhookId}`,
    );
  } catch (error) {
    console.error('Failed to create configuration file:', error);
    vscode.window.showErrorMessage(
      `Failed to create configuration file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
