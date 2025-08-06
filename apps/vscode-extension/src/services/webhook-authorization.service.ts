import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import type { AuthStore } from './auth.service';

const log = debug('unhook:vscode:webhook-authorization');

export interface WebhookAuthorizationState {
  isUnauthorized: boolean;
  webhookId: string | null;
  hasPendingRequest: boolean;
}

export class WebhookAuthorizationService implements vscode.Disposable {
  private static instance: WebhookAuthorizationService;

  private _onDidChangeAuthorizationState =
    new vscode.EventEmitter<WebhookAuthorizationState>();
  readonly onDidChangeAuthorizationState =
    this._onDidChangeAuthorizationState.event;

  private _onAccessAlreadyGranted = new vscode.EventEmitter<void>();
  readonly onAccessAlreadyGranted = this._onAccessAlreadyGranted.event;

  private state: WebhookAuthorizationState = {
    hasPendingRequest: false,
    isUnauthorized: false,
    webhookId: null,
  };

  private disposables: vscode.Disposable[] = [];

  private constructor() {
    log('Initializing WebhookAuthorizationService');
  }

  static getInstance(): WebhookAuthorizationService {
    if (!WebhookAuthorizationService.instance) {
      WebhookAuthorizationService.instance = new WebhookAuthorizationService();
    }
    return WebhookAuthorizationService.instance;
  }

  getState(): WebhookAuthorizationState {
    return { ...this.state };
  }

  async handleAuthorizationError(
    webhookId: string,
    authStore: AuthStore,
  ): Promise<void> {
    log('Handling authorization error for webhook', { webhookId });

    this.state.isUnauthorized = true;
    this.state.webhookId = webhookId;

    // Check if there's already a pending request
    if (authStore.isSignedIn && webhookId) {
      try {
        const pendingRequest =
          await authStore.api.webhookAccessRequests.checkPendingRequest.query({
            webhookId,
          });
        this.state.hasPendingRequest = !!pendingRequest;
        log('Pending request check', {
          hasPendingRequest: this.state.hasPendingRequest,
        });
      } catch (err) {
        log('Failed to check pending request', { error: err });
        this.state.hasPendingRequest = false;
      }
    }

    this._onDidChangeAuthorizationState.fire(this.getState());
  }

  handleAuthorizationSuccess(): void {
    log('Handling authorization success');

    this.state.isUnauthorized = false;
    this.state.webhookId = null;
    this.state.hasPendingRequest = false;

    this._onDidChangeAuthorizationState.fire(this.getState());
  }

  setHasPendingRequest(hasPending: boolean): void {
    log('Setting pending request state', { hasPending });
    this.state.hasPendingRequest = hasPending;
    this._onDidChangeAuthorizationState.fire(this.getState());
  }

  async requestAccess(authStore: AuthStore, message?: string): Promise<void> {
    if (!this.state.webhookId) {
      throw new Error('No webhook ID found');
    }

    if (!authStore.isSignedIn) {
      throw new Error('Please sign in to Unhook first');
    }

    log('Requesting webhook access', {
      hasMessage: !!message,
      webhookId: this.state.webhookId,
    });

    try {
      await authStore.api.webhookAccessRequests.create.mutate({
        requesterMessage: message,
        webhookId: this.state.webhookId,
      });

      // Update state to show pending request
      this.setHasPendingRequest(true);

      vscode.window.showInformationMessage(
        'Access request sent successfully! You will be notified when your request is reviewed.',
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.indexOf('already have a pending request') !== -1) {
        vscode.window.showInformationMessage(
          'You already have a pending access request for this webhook.',
        );
        this.setHasPendingRequest(true);
      } else if (errorMessage.indexOf('already have access') !== -1) {
        // User already has access, clear unauthorized state
        this.handleAuthorizationSuccess();
        vscode.window.showInformationMessage(
          'You already have access to this webhook. Refreshing...',
        );
        log('Firing onAccessAlreadyGranted event');
        this._onAccessAlreadyGranted.fire();
      } else {
        throw error;
      }
    }
  }

  dispose() {
    log('Disposing WebhookAuthorizationService');
    this._onDidChangeAuthorizationState.dispose();
    this._onAccessAlreadyGranted.dispose();

    // Clean up all disposables
    this.disposables.forEach((disposable) => disposable.dispose());
    this.disposables = [];
  }
}
