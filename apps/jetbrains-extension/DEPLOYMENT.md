# JetBrains Extension Deployment Guide

This guide explains how to set up automated deployment of the Unhook JetBrains extension to the JetBrains Marketplace using GitHub Actions.

## Required GitHub Secrets

To enable automated publishing, you need to configure the following secrets in your GitHub repository:

### JetBrains Marketplace Secrets

#### `JETBRAINS_MARKETPLACE_TOKEN`
- **Purpose**: Authentication token for publishing to JetBrains Marketplace
- **How to get it**:
  1. Go to [JetBrains Marketplace](https://plugins.jetbrains.com/)
  2. Sign in with your JetBrains account
  3. Navigate to your profile → "API Tokens"
  4. Create a new token with publishing permissions
  5. Copy the token value

#### `JETBRAINS_CERTIFICATE_CHAIN` (Optional but recommended)
- **Purpose**: Certificate chain for plugin signing
- **How to get it**:
  1. Purchase a code signing certificate from a trusted CA
  2. Export the certificate chain in PEM format
  3. Remove line breaks and store as a single-line string

#### `JETBRAINS_PRIVATE_KEY` (Optional but recommended)  
- **Purpose**: Private key for plugin signing
- **How to get it**:
  1. Export your private key in PEM format
  2. Remove line breaks and store as a single-line string

#### `JETBRAINS_PRIVATE_KEY_PASSWORD` (Optional)
- **Purpose**: Password for the private key (if encrypted)
- **Value**: The password used to encrypt your private key

## Workflow Trigger

The GitHub Actions workflow (`jetbrains-extension-release.yml`) is triggered by:

1. **Version Bumps**: Automatically triggered when the changeset workflow bumps the JetBrains extension version
2. **Manual Trigger**: Can be manually triggered from the GitHub Actions tab

## Release Process

### Automatic Release (Recommended)

1. **Create a Changeset**:
   ```bash
   bunx changeset
   # Select the jetbrains-extension package
   # Choose the appropriate version bump (patch, minor, major)
   # Write a description of the changes
   ```

2. **Commit and Push**:
   ```bash
   git add .
   git commit -m "feat: add new feature to jetbrains extension"
   git push
   ```

3. **Merge Changeset PR**:
   - The changeset bot will create a PR with version bumps
   - Review and merge the PR
   - This will trigger the release workflow

### Manual Release

1. **Go to GitHub Actions**:
   - Navigate to your repository → Actions tab
   - Select "JetBrains Extension Release" workflow
   - Click "Run workflow"

2. **Monitor Progress**:
   - The workflow will build, verify, sign (if configured), and publish the plugin
   - Check the logs for any errors

## Build Process

The release workflow performs the following steps:

1. **Environment Setup**:
   - Sets up Node.js and Bun
   - Sets up Java 21
   - Sets up Gradle

2. **Build & Verification**:
   - Builds the plugin using Gradle
   - Runs plugin verification checks
   - Ensures compatibility with target IDE versions

3. **Signing** (if configured):
   - Signs the plugin with your certificate
   - Adds trust verification for the plugin

4. **Publishing**:
   - Uploads the plugin to JetBrains Marketplace
   - Creates a GitHub release with the plugin distribution
   - Uploads build artifacts

5. **GitHub Release**:
   - Creates a release with tag `jetbrains-vX.X.X`
   - Includes changelog from `CHANGELOG.md`
   - Attaches the plugin distribution file

## Plugin Verification

Before publishing, the workflow runs several verification steps:

- **Compatibility Check**: Ensures the plugin works with specified IDE versions
- **API Usage Validation**: Checks for usage of deprecated or internal APIs
- **Plugin Structure**: Validates the plugin.xml and overall structure
- **Dependency Analysis**: Checks for missing or conflicting dependencies

## Local Development

### Building Locally

```bash
cd apps/jetbrains-extension

# Build the plugin
./gradlew build

# Run verification
./gradlew verifyPlugin

# Build distribution
./gradlew buildPlugin
```

### Testing Locally

```bash
# Run IDE with plugin for testing
./gradlew runIde

# Run tests
./gradlew test
```

## Troubleshooting

### Common Issues

#### Build Failures
- **Java Version**: Ensure Java 21 is installed and configured
- **Gradle Wrapper**: Make sure `gradlew` has execute permissions (`chmod +x gradlew`)
- **Dependencies**: Check if all required dependencies are available

#### Publishing Failures
- **Token Permissions**: Verify the marketplace token has publishing permissions
- **Plugin ID Conflict**: Ensure the plugin ID is unique in the marketplace
- **Version Conflicts**: Check if the version already exists in the marketplace

#### Signing Issues
- **Certificate Format**: Ensure certificates are in correct PEM format
- **Key Permissions**: Verify the private key matches the certificate
- **Password**: Check if the private key password is correct

### Logs and Debugging

- **GitHub Actions Logs**: Check the workflow logs in GitHub Actions
- **Plugin Verifier**: Review the verification report in build artifacts
- **Gradle Logs**: Use `--debug` flag for detailed Gradle output

## Security Considerations

- **Secrets Management**: Never commit secrets to the repository
- **Token Rotation**: Regularly rotate marketplace tokens
- **Certificate Security**: Store certificates securely and limit access
- **Signing**: Always sign plugins for production releases

## Support

- [JetBrains Plugin Development Documentation](https://plugins.jetbrains.com/docs/intellij/)
- [IntelliJ Platform Gradle Plugin](https://github.com/JetBrains/gradle-intellij-plugin)
- [JetBrains Marketplace](https://plugins.jetbrains.com/)
- [GitHub Issues](https://github.com/unhook-sh/unhook/issues)