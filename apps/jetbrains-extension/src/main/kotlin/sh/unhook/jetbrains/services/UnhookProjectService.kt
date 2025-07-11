package sh.unhook.jetbrains.services

import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import sh.unhook.jetbrains.config.UnhookConfigManager
import sh.unhook.jetbrains.events.UnhookEventManager
import sh.unhook.jetbrains.models.WebhookEvent
import java.nio.file.Paths

@Service(Service.Level.PROJECT)
class UnhookProjectService(private val project: Project) {
    
    private val logger = thisLogger()
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    
    private val _events = MutableStateFlow<List<WebhookEvent>>(emptyList())
    val events: StateFlow<List<WebhookEvent>> = _events.asStateFlow()
    
    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()
    
    private val _connectionStatus = MutableStateFlow("Disconnected")
    val connectionStatus: StateFlow<String> = _connectionStatus.asStateFlow()
    
    val configManager = UnhookConfigManager(project)
    val eventManager = UnhookEventManager(project, serviceScope)
    
    init {
        logger.info("Initializing UnhookProjectService for project: ${project.name}")
        
        // Load configuration
        serviceScope.launch {
            configManager.loadConfiguration()
        }
        
        // Set up event listeners
        setupEventListeners()
    }
    
    private fun setupEventListeners() {
        serviceScope.launch {
            eventManager.events.collect { eventList ->
                _events.value = eventList
            }
        }
        
        serviceScope.launch {
            eventManager.isConnected.collect { connected ->
                _isConnected.value = connected
                _connectionStatus.value = if (connected) "Connected" else "Disconnected"
            }
        }
    }
    
    fun findConfigFile(): VirtualFile? {
        return project.baseDir?.findChild("unhook.yaml") 
            ?: project.baseDir?.findChild("unhook.yml")
    }
    
    fun getConfigPath(): String? {
        val configFile = findConfigFile()
        return configFile?.path ?: run {
            val basePath = project.basePath
            if (basePath != null) {
                Paths.get(basePath, "unhook.yaml").toString()
            } else {
                null
            }
        }
    }
    
    fun hasValidConfig(): Boolean {
        return configManager.hasValidConfig()
    }
    
    fun startEventMonitoring() {
        serviceScope.launch {
            eventManager.startEventMonitoring()
        }
    }
    
    fun stopEventMonitoring() {
        serviceScope.launch {
            eventManager.stopEventMonitoring()
        }
    }
    
    fun refreshEvents() {
        serviceScope.launch {
            eventManager.refreshEvents()
        }
    }
    
    fun clearEvents() {
        serviceScope.launch {
            eventManager.clearEvents()
        }
    }
    
    fun replayEvent(eventId: String) {
        serviceScope.launch {
            eventManager.replayEvent(eventId)
        }
    }
    
    fun isEventMonitoringActive(): Boolean {
        return eventManager.isActive()
    }
    
    fun dispose() {
        serviceScope.cancel()
        eventManager.dispose()
    }
    
    companion object {
        fun getInstance(project: Project): UnhookProjectService {
            return project.getService(UnhookProjectService::class.java)
        }
    }
}