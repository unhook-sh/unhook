import * as vscode from 'vscode';

export function getStatusIconPath(
  status: number | undefined,
  context: vscode.ExtensionContext,
) {
  const iconPath = (filename: string) => ({
    light: vscode.Uri.file(
      context.asAbsolutePath(`src/public/${filename}.svg`),
    ),
    dark: vscode.Uri.file(context.asAbsolutePath(`src/public/${filename}.svg`)),
  });

  if (status === 200) {
    return iconPath('check-green');
  }
  if (status === 401) {
    return iconPath('x-red');
  }
  if (status === 404) {
    return iconPath('slash-gray');
  }
  if (status === 102) {
    return iconPath('loading');
  }
  return new vscode.ThemeIcon(
    'circle-outline',
    new vscode.ThemeColor('icon.foreground'),
  );
}
