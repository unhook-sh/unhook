# Gradle Wrapper

This directory contains the Gradle Wrapper files for the JetBrains extension.

## Missing gradle-wrapper.jar

The `gradle-wrapper.jar` file is not included in the repository to keep it clean. 

To generate the Gradle wrapper JAR file, run the following command from the `apps/jetbrains-extension` directory:

```bash
# Generate the Gradle wrapper
gradle wrapper --gradle-version=8.5

# Or if you have Gradle installed globally
./gradlew wrapper --gradle-version=8.5
```

This will create the `gradle-wrapper.jar` file in this directory.

## Files

- `gradle-wrapper.properties` - Configuration for Gradle wrapper
- `gradle-wrapper.jar` - Gradle wrapper JAR (generated)

## Usage

Once the wrapper is set up, you can use these commands:

```bash
# Build the plugin
./gradlew build

# Run the IDE with plugin
./gradlew runIde

# Verify plugin compatibility  
./gradlew verifyPlugin

# Build distribution
./gradlew buildPlugin

# Publish to marketplace
./gradlew publishPlugin
```