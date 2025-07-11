import type { EventType, RequestType } from '@unhook/db/schema';
import * as vscode from 'vscode';

export function getStatusIconPath({
  request,
  eventStatus,
  context,
}: {
  request: RequestType | null;
  eventStatus?: EventType['status'];
  context: vscode.ExtensionContext;
}) {
  const iconPath = (filename: string) => ({
    dark: vscode.Uri.file(context.asAbsolutePath(`src/media/${filename}.svg`)),
    light: vscode.Uri.file(context.asAbsolutePath(`src/media/${filename}.svg`)),
  });

  if (!request) {
    // If no request, use event status to determine icon
    if (eventStatus === 'pending' || eventStatus === 'processing') {
      return new vscode.ThemeIcon(
        'sync',
        new vscode.ThemeColor('charts.yellow'),
      );
    }
    if (eventStatus === 'failed') {
      return new vscode.ThemeIcon('error', new vscode.ThemeColor('charts.red'));
    }
    if (eventStatus === 'completed') {
      return new vscode.ThemeIcon(
        'pass',
        new vscode.ThemeColor('charts.green'),
      );
    }
    return new vscode.ThemeIcon(
      'circle-outline',
      new vscode.ThemeColor('icon.foreground'),
    );
  }

  if (request.status === 'pending') {
    return iconPath('loading');
  }

  const status = request.response?.status;

  if (typeof status === 'number') {
    if (status >= 200 && status < 300) {
      return iconPath('check-green');
    }
    if (status >= 400 && status < 500) {
      return iconPath('x-red');
    }
    if (status >= 500 && status < 600) {
      return iconPath('slash-gray');
    }
    if (status >= 100 && status < 200) {
      return iconPath('loading');
    }
  }

  return new vscode.ThemeIcon(
    'circle-outline',
    new vscode.ThemeColor('icon.foreground'),
  );
}
