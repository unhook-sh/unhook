plugins {
    id("java")
    id("org.jetbrains.kotlin.jvm") version "1.9.25"
    id("org.jetbrains.intellij.platform") version "2.3.0"
}

group = "sh.unhook"
version = "0.2.4"

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    // IntelliJ Platform dependencies
    intellijPlatform {
        create("IC", "2024.2.6")
        testFramework(org.jetbrains.intellij.platform.gradle.TestFrameworkType.Platform)
    }

    // Shared packages from the workspace
    implementation("@unhook/client:0.5.3")
    implementation("@unhook/logger:workspace:*")

    // External dependencies
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:okhttp-sse:4.12.0")
    implementation("com.google.code.gson:gson:2.10.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-swing:1.8.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")

    // Test dependencies
    testImplementation("org.jetbrains.kotlin:kotlin-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit")
}

intellijPlatform {
    pluginConfiguration {
        ideaVersion {
            sinceBuild = "242"
            untilBuild = "243.*"
        }

        changeNotes = """
            <h3>0.2.4</h3>
            <ul>
                <li>Initial release of Unhook JetBrains plugin</li>
                <li>Webhook event monitoring and inspection</li>
                <li>Real-time webhook forwarding to local endpoints</li>
                <li>Team collaboration features</li>
                <li>Authentication with Unhook service</li>
            </ul>
        """.trimIndent()
    }

    publishing {
        token = System.getenv("JETBRAINS_MARKETPLACE_TOKEN")
    }

    signing {
        certificateChain = System.getenv("JETBRAINS_CERTIFICATE_CHAIN")
        privateKey = System.getenv("JETBRAINS_PRIVATE_KEY")
        password = System.getenv("JETBRAINS_PRIVATE_KEY_PASSWORD")
    }
}

tasks {
    withType<JavaCompile> {
        sourceCompatibility = "21"
        targetCompatibility = "21"
    }

    withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
        kotlinOptions.jvmTarget = "21"
    }

    test {
        useJUnitPlatform()
    }

    buildSearchableOptions {
        enabled = false
    }
}

kotlin {
    jvmToolchain(21)
}