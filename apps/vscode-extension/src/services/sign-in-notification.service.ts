import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import type { AuthStore } from './auth.service';

const log = debug('unhook:vscode:sign-in-notification');
const DO_NOT_ASK_AGAIN_KEY = 'unhook.signInNotification.doNotAskAgain';

export class SignInNotificationService implements vscode.Disposable {
  private static instance: SignInNotificationService;
  private context: vscode.ExtensionContext;
  private authStore: AuthStore | null = null;
  private hasShownNotification = false;

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
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

  public setAuthStore(authStore: AuthStore): void {
    this.authStore = authStore;
  }

  public async shouldShowNotification(): Promise<boolean> {
    if (this.hasShownNotification) {
      return false;
    }

    const doNotAskAgain =
      this.context.globalState.get<boolean>(DO_NOT_ASK_AGAIN_KEY);
    if (doNotAskAgain) {
      log('User has chosen not to be asked again for sign-in');
      return false;
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
    const doNotAskAgainAction = 'Do Not Ask Again';

    const action = await vscode.window.showInformationMessage(
      message,
      signInAction,
      doNotAskAgainAction,
    );

    if (action === signInAction) {
      log('User chose to sign in from notification');
      await vscode.commands.executeCommand('unhook.signIn');
    } else if (action === doNotAskAgainAction) {
      log('User chose not to be asked again for sign-in');
      await this.context.globalState.update(DO_NOT_ASK_AGAIN_KEY, true);
    }
  }

  public async resetDoNotAskAgain(): Promise<void> {
    await this.context.globalState.update(DO_NOT_ASK_AGAIN_KEY, false);
    this.hasShownNotification = false;
    log('Reset do not ask again preference');
  }

  public dispose(): void {
    // No cleanup needed for this service
  }
}
