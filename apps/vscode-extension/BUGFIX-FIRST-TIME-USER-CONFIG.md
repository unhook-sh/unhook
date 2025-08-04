# First-Time User Configuration Bug Fix

## Problem Description

There was a bug in the VS Code extension's first-time user experience where when a new `unhook.yml` configuration file was created for the first time, the extension wasn't watching for changes to that file and didn't pick up the webhook ID or any of the configuration. This resulted in the extension not making the initial requests for subscription and events.

## Root Cause

The issue occurred because:

1. **File Creation Without Watching**: When `FirstTimeUserService.createUnhookYml()` created the file using `vscode.workspace.fs.writeFile()`, the extension didn't immediately detect and load the new configuration.

2. **Missing File Watchers**: The file watchers in `EventsConfigManager` and `ConfigProvider` were only set up when a config file was found during initialization, but they weren't watching for newly created files.

3. **No Configuration Reload**: After creating the file, the extension didn't trigger a configuration reload, so the `fetchAndUpdateEvents()` method in `EventsProvider` didn't run.

4. **Missing Initial Requests**: Since the config wasn't loaded, no subscription or events requests were made.

## Solution

The fix includes several enhancements to ensure proper configuration detection and reloading:

### 1. Enhanced FirstTimeUserService

**File**: `src/services/first-time-user.service.ts`

- Added `triggerConfigurationReload()` method that:
  - Reloads configuration in `ConfigManager`
  - Adds a small delay to ensure file system has settled
  - Triggers events refresh via `vscode.commands.executeCommand('unhook.events.refresh')`

- Called `triggerConfigurationReload()` after successfully creating the `unhook.yml` file

### 2. Improved EventsConfigManager

**File**: `src/providers/events-config.manager.ts`

- Added `workspaceWatcher` to watch for newly created config files
- Added `setupWorkspaceWatcher()` method that watches for config files in the workspace
- Enhanced `onConfigFileChanged()` to preserve `configPath` when file is modified
- Added `onConfigFileDeleted()` method for proper cleanup when files are deleted
- Improved `getConfig()` method to try reloading from cached path when config is cleared
- Added `forceReload()` method to manually trigger configuration reload
- Enhanced `dispose()` method to clean up both watchers
- Added comprehensive logging to track configuration loading and file watching

### 3. Optimized ConfigProvider

**File**: `src/providers/config.provider.ts`

- Removed redundant `workspaceWatcher` to avoid duplicate file watching
- Kept `dispose()` method that cleans up `configWatcher`
- Relies on `EventsConfigManager` for configuration change notifications
- Added proper subscription management in `extension.ts`

### 4. Enhanced EventsProvider

**File**: `src/providers/events.provider.ts`

- Modified `refreshAndFetchEvents()` to call `configManager.forceReload()` before fetching events
- Added logging to `fetchAndUpdateEvents()` to track configuration loading

### 5. Updated Extension Management

**File**: `src/extension.ts`

- Added `configProvider` and `eventsProvider` to the subscriptions array to ensure proper disposal

## Flow After Fix

1. **User creates unhook.yml**: `FirstTimeUserService.createUnhookYml()` is called
2. **File is created**: `vscode.workspace.fs.writeFile()` creates the file
3. **Configuration reload triggered**: `triggerConfigurationReload()` is called
4. **Events refresh triggered**: `vscode.commands.executeCommand('unhook.events.refresh')` is called
5. **EventsProvider forces config reload**: `configManager.forceReload()` is called
6. **Config cache cleared**: Configuration cache is cleared and ConfigProvider is notified
7. **EventsProvider fetches events**: `fetchAndUpdateEvents()` is called
8. **Config reloaded**: `EventsConfigManager.getConfig()` reloads the new configuration
9. **Subscription and events requests made**: The extension now properly fetches events and makes subscription requests

## Testing

A test file was created at `test/first-time-user-config-bug.test.ts` to document and verify the fix.

## Impact

This fix ensures that:
- First-time users get immediate feedback when they create their first `unhook.yml` file
- The extension properly detects and loads newly created configuration files
- Events and subscription requests are made immediately after configuration creation
- File watchers are properly set up and disposed of to prevent memory leaks

## Files Modified

1. `src/services/first-time-user.service.ts` - Added configuration reload trigger
2. `src/providers/events-config.manager.ts` - Enhanced file watching, config reloading, and added forceReload method
3. `src/providers/config.provider.ts` - Optimized to avoid duplicate watchers
4. `src/providers/events.provider.ts` - Enhanced to force config reload before fetching events
5. `src/extension.ts` - Added proper subscription management
6. `test/first-time-user-config-bug.test.ts` - Added test documentation