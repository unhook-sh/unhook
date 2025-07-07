import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { isDeliveryEnabled } from '../commands/delivery.commands';
import type { AuthStore } from './auth.service';
import { WebhookAuthorizationService } from './webhook-authorization.service';

const log = debug('unhook:vscode:status-bar');

export class StatusBarService implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private authStore: AuthStore | null = null;
  private authorizationService: WebhookAuthorizationService;
  
  constructor() {
    log('Initializing StatusBarService');
    
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    
    this.authorizationService = WebhookAuthorizationService.getInstance();
    
    // Listen for authorization state changes
    this.authorizationService.onDidChangeAuthorizationState(() => this.update());
    
    // Listen for delivery setting changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('unhook.delivery.enabled')) {
        this.update();
      }
    });
  }
  
  setAuthStore(authStore: AuthStore) {
    this.authStore = authStore;
    
    // Listen for auth state changes
    authStore.onDidChangeAuth(() => this.update());
    
    this.update();
  }
  
  update() {
    if (!this.authStore) {
      return;
    }
    
    const deliveryEnabled = isDeliveryEnabled();
    const deliveryIcon = deliveryEnabled ? '$(play)' : '$(debug-pause)';
    const deliveryStatus = deliveryEnabled ? 'enabled' : 'paused';
    const authState = this.authorizationService.getState();
    
    if (this.authStore.isValidatingSession) {
      this.statusBarItem.text = '$(sync~spin) Validating Unhook Session...';
      this.statusBarItem.tooltip = 'Validating your Unhook session...';
      this.statusBarItem.command = undefined;
    } else if (this.authStore.isSignedIn) {
      // Check if webhook is unauthorized
      if (authState.isUnauthorized) {
        if (authState.hasPendingRequest) {
          this.statusBarItem.text = '$(clock) Unhook: Access pending';
          this.statusBarItem.tooltip = 'Your webhook access request is pending approval';
          this.statusBarItem.command = undefined;
        } else {
          this.statusBarItem.text = '$(error) Unhook: No webhook access';
          this.statusBarItem.tooltip = 'You do not have access to this webhook\nClick to request access';
          this.statusBarItem.command = 'unhook.requestWebhookAccess';
        }
      } else {
        this.statusBarItem.text = `$(check) Unhook ${deliveryIcon}`;
        this.statusBarItem.tooltip = `Unhook connected • Event forwarding ${deliveryStatus}\nClick to open Quick Actions`;
        this.statusBarItem.command = 'unhook.showQuickPick';
      }
    } else {
      this.statusBarItem.text = '$(sign-in) Sign in to Unhook';
      this.statusBarItem.tooltip = 'Click to sign in to Unhook';
      this.statusBarItem.command = 'unhook.signIn';
    }
    
    this.statusBarItem.show();
  }
  
  dispose() {
    log('Disposing StatusBarService');
    this.statusBarItem.dispose();
  }
}