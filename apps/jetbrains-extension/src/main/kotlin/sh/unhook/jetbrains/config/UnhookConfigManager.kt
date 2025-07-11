package sh.unhook.jetbrains.config

import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.project.Project
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import java.io.File
import java.nio.file.Paths

class UnhookConfigManager(private val project: Project) {
    
    private val logger = thisLogger()
    
    private val _config = MutableStateFlow<UnhookConfig?>(null)
    val config: StateFlow<UnhookConfig?> = _config.asStateFlow()
    
    private val _isConfigValid = MutableStateFlow(false)
    val isConfigValid: StateFlow<Boolean> = _isConfigValid.asStateFlow()
    
    private val json = Json { 
        ignoreUnknownKeys = true 
        isLenient = true
    }
    
    suspend fun loadConfiguration() {
        try {
            val configPath = getConfigPath()
            if (configPath != null) {
                val configFile = File(configPath)
                if (configFile.exists()) {
                    val configContent = configFile.readText()
                    val config = parseYamlConfig(configContent)
                    _config.value = config
                    _isConfigValid.value = config.isValid()
                    logger.info("Loaded configuration from: $configPath")
                } else {
                    logger.info("No configuration file found at: $configPath")
                    _config.value = null
                    _isConfigValid.value = false
                }
            } else {
                logger.warn("No configuration path available")
                _config.value = null
                _isConfigValid.value = false
            }
        } catch (e: Exception) {
            logger.error("Failed to load configuration", e)
            _config.value = null
            _isConfigValid.value = false
        }
    }
    
    fun hasValidConfig(): Boolean = _isConfigValid.value
    
    fun getConfig(): UnhookConfig? = _config.value
    
    private fun getConfigPath(): String? {
        val basePath = project.basePath ?: return null
        
        // Check for unhook.yaml first, then unhook.yml
        val yamlPath = Paths.get(basePath, "unhook.yaml").toString()
        if (File(yamlPath).exists()) {
            return yamlPath
        }
        
        val ymlPath = Paths.get(basePath, "unhook.yml").toString()
        if (File(ymlPath).exists()) {
            return ymlPath
        }
        
        return yamlPath // Return default path even if file doesn't exist
    }
    
    private fun parseYamlConfig(yamlContent: String): UnhookConfig {
        // TODO: Implement proper YAML parsing
        // For now, return a default config
        return UnhookConfig(
            teamId = "default-team",
            apiKey = "default-api-key",
            webhookUrl = "https://unhook.sh/wh_example",
            endpoints = mapOf(
                "default" to EndpointConfig(
                    url = "http://localhost:3000/webhook",
                    method = "POST"
                )
            )
        )
    }
}

@Serializable
data class UnhookConfig(
    val teamId: String,
    val apiKey: String,
    val webhookUrl: String,
    val endpoints: Map<String, EndpointConfig> = emptyMap(),
    val filters: List<String> = emptyList(),
    val settings: ConfigSettings = ConfigSettings()
) {
    fun isValid(): Boolean {
        return teamId.isNotBlank() && apiKey.isNotBlank() && webhookUrl.isNotBlank()
    }
}

@Serializable
data class EndpointConfig(
    val url: String,
    val method: String = "POST",
    val headers: Map<String, String> = emptyMap(),
    val timeout: Int = 30000
)

@Serializable
data class ConfigSettings(
    val maxEventHistory: Int = 100,
    val autoReconnect: Boolean = true,
    val notificationsEnabled: Boolean = true,
    val logLevel: String = "info"
)