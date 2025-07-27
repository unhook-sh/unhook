import type * as vscode from 'vscode';
import type { LogDestination, LogMessage } from '../types';
import { formatLogArgs } from '../utils';

export interface VSCodeOutputDestinationOptions {
  name: string;
  vscode: typeof vscode;
  autoShow?: boolean;
}

export class VSCodeOutputDestination implements LogDestination {
  private outputChannel: vscode.OutputChannel;
  private _autoShow: boolean;

  constructor(options: VSCodeOutputDestinationOptions) {
    this.outputChannel = options.vscode.window.createOutputChannel(
      options.name,
    );
    this._autoShow = options.autoShow ?? false;
  }

  get autoShow(): boolean {
    return this._autoShow;
  }

  set autoShow(value: boolean) {
    this._autoShow = value;
  }

  write(message: LogMessage): void {
    const { level, namespace, args, timestamp } = message;
    const formattedArgs = formatLogArgs(args);
    const formattedMessage = `[${timestamp.toISOString()}] [${level.toUpperCase()}] ${namespace}: ${formattedArgs}`;
    this.outputChannel.appendLine(formattedMessage);

    if (this._autoShow) {
      this.show();
    }
  }

  show(): void {
    this.outputChannel.show(true);
  }

  hide(): void {
    this.outputChannel.hide();
  }

  clear(): void {
    this.outputChannel.clear();
  }

  dispose(): void {
    this.outputChannel.dispose();
  }
}
