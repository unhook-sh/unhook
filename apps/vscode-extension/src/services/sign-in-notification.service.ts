import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import type { AuthStore } from './auth.service';

const log = debug('unhook:vscode:sign-in-notification');
const DO_NOT_ASK_AGAIN_GLOBAL_KEY =
  'unhook.signInNotification.doNotAskAgain.global';
const DO_NOT_ASK_AGAIN_WORKSPACE_KEY =
  'unhook.signInNotification.doNotAskAgain.workspace';

export class SignInNotificationService implements vscode.Disposable {
  private static instance: SignInNotificationService;
  private context: vscode.ExtensionContext;
  private authStore: AuthStore | null = null;
  private hasShownNotification = false;
  private disposables: vscode.Disposable[] = [];
  private currentWorkspaceId: string | null = null;

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.updateCurrentWorkspaceId();
  }

  public static getInstance(
    context: vscode.ExtensionContext,
  ): SignInNotificationService {
    if (!SignInNotificationService.instance) {
      SignInNotificationService.instance = new SignInNotificationService(
        context,
      );
    }
    return SignInNotificationService.instance;
  }

  private updateCurrentWorkspaceId(): void {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    this.currentWorkspaceId = workspaceFolder?.uri.fsPath || null;
  }

  public setAuthStore(authStore: AuthStore): void {
    this.authStore = authStore;

    // Listen for auth state changes
    const authDisposable = authStore.onDidChangeAuth(() => {
      this.handleAuthStateChange();
    });
    this.disposables.push(authDisposable);

    // Listen for workspace folder changes
    const workspaceDisposable = vscode.workspace.onDidChangeWorkspaceFolders(
      () => {
        this.updateCurrentWorkspaceId();
      },
    );
    this.disposables.push(workspaceDisposable);

    // Show initial notification if user is not signed in
    this.showInitialNotification();
  }

  private async handleAuthStateChange(): Promise<void> {
    if (!this.authStore) {
      return;
    }

    // Handle sign-in notification when auth status changes
    if (!this.authStore.isSignedIn) {
      // Reset notification state to allow showing notification again when user signs out
      this.resetNotificationState();
      // Show sign-in notification after a short delay
      setTimeout(async () => {
        await this.showSignInNotification();
      }, 1000);
    }
  }

  private async showInitialNotification(): Promise<void> {
    // Show initial sign-in notification if user is not signed in when extension starts
    // This handles the case where the extension is activated but the user hasn't signed in yet
    setTimeout(async () => {
      await this.showSignInNotification();
    }, 3000);
  }

  public async shouldShowNotification(): Promise<boolean> {
    if (this.hasShownNotification) {
      return false;
    }

    // Check global preference
    const doNotAskAgainGlobal = this.context.globalState.get<boolean>(
      DO_NOT_ASK_AGAIN_GLOBAL_KEY,
    );
    if (doNotAskAgainGlobal) {
      log('User has chosen not to be asked again for sign-in (global)');
      return false;
    }

    // Check workspace-specific preference
    if (this.currentWorkspaceId) {
      const workspacePreferences = this.context.globalState.get<
        Record<string, boolean>
      >(DO_NOT_ASK_AGAIN_WORKSPACE_KEY, {});

      if (workspacePreferences[this.currentWorkspaceId]) {
        log('User has chosen not to be asked again for sign-in (workspace)');
        return false;
      }
    }

    if (!this.authStore) {
      log('Auth store not set, cannot determine sign-in status');
      return false;
    }

    return !this.authStore.isSignedIn;
  }

  public async showSignInNotification(): Promise<void> {
    if (this.hasShownNotification) {
      return;
    }

    const shouldShow = await this.shouldShowNotification();
    if (!shouldShow) {
      return;
    }

    this.hasShownNotification = true;

    const message = 'Sign in to Unhook to access webhook events and features';
    const signInAction = 'Sign In';
    const notNowAction = 'Not Now';

    const action = await vscode.window.showInformationMessage(
      message,
      signInAction,
      notNowAction,
    );

    if (action === signInAction) {
      log('User chose to sign in from notification');
      await vscode.commands.executeCommand('unhook.signIn');
    } else if (action === notNowAction) {
      // Show follow-up notification for "do not ask again" options
      await this.showDoNotAskAgainNotification();
    }
  }

  private async showDoNotAskAgainNotification(): Promise<void> {
    const message = 'Would you like to stop seeing this notification?';
    const workspaceAction = 'This Workspace';
    const globalAction = 'All Workspaces';
    const cancelAction = 'Cancel';

    const action = await vscode.window.showInformationMessage(
      message,
      workspaceAction,
      globalAction,
      cancelAction,
    );

    if (action === workspaceAction) {
      log('User chose not to be asked again for sign-in (workspace)');
      await this.setWorkspaceDoNotAskAgain(true);
    } else if (action === globalAction) {
      log('User chose not to be asked again for sign-in (global)');
      await this.setGlobalDoNotAskAgain(true);
    }
    // If action is cancelAction or undefined, do nothing
  }

  private async setWorkspaceDoNotAskAgain(value: boolean): Promise<void> {
    if (!this.currentWorkspaceId) {
      return;
    }

    const workspacePreferences = this.context.globalState.get<
      Record<string, boolean>
    >(DO_NOT_ASK_AGAIN_WORKSPACE_KEY, {});

    workspacePreferences[this.currentWorkspaceId] = value;
    await this.context.globalState.update(
      DO_NOT_ASK_AGAIN_WORKSPACE_KEY,
      workspacePreferences,
    );
  }

  private async setGlobalDoNotAskAgain(value: boolean): Promise<void> {
    await this.context.globalState.update(DO_NOT_ASK_AGAIN_GLOBAL_KEY, value);
  }

  /**
   * Reset the notification state when auth status changes.
   * This allows showing the notification again when a user signs out.
   */
  public resetNotificationState(): void {
    this.hasShownNotification = false;
    log('Reset notification state for auth change');
  }

  public async resetDoNotAskAgain(): Promise<void> {
    await this.setGlobalDoNotAskAgain(false);
    await this.setWorkspaceDoNotAskAgain(false);
    this.hasShownNotification = false;
    log('Reset do not ask again preference');
  }

  public async resetWorkspaceDoNotAskAgain(): Promise<void> {
    await this.setWorkspaceDoNotAskAgain(false);
    this.hasShownNotification = false;
    log('Reset workspace do not ask again preference');
  }

  public async resetGlobalDoNotAskAgain(): Promise<void> {
    await this.setGlobalDoNotAskAgain(false);
    this.hasShownNotification = false;
    log('Reset global do not ask again preference');
  }

  /**
   * Get the current notification preferences for debugging or UI purposes
   */
  public getNotificationPreferences(): {
    global: boolean;
    workspace: boolean;
    currentWorkspaceId: string | null;
  } {
    const global = this.context.globalState.get<boolean>(
      DO_NOT_ASK_AGAIN_GLOBAL_KEY,
      false,
    );
    const workspacePreferences = this.context.globalState.get<
      Record<string, boolean>
    >(DO_NOT_ASK_AGAIN_WORKSPACE_KEY, {});
    const workspace = this.currentWorkspaceId
      ? workspacePreferences[this.currentWorkspaceId] || false
      : false;

    return {
      currentWorkspaceId: this.currentWorkspaceId,
      global,
      workspace,
    };
  }

  public dispose(): void {
    this.disposables.forEach((disposable) => {
      disposable.dispose();
    });
    this.disposables = [];
  }
}
