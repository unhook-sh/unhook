package sh.unhook.jetbrains.events

import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.project.Project
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import sh.unhook.jetbrains.models.WebhookEvent
import sh.unhook.jetbrains.services.UnhookApplicationService
import java.time.Instant
import java.util.UUID

class UnhookEventManager(
    private val project: Project,
    private val scope: CoroutineScope
) {
    
    private val logger = thisLogger()
    
    private val _events = MutableStateFlow<List<WebhookEvent>>(emptyList())
    val events: StateFlow<List<WebhookEvent>> = _events.asStateFlow()
    
    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()
    
    private val _isActive = MutableStateFlow(false)
    val isActive: StateFlow<Boolean> = _isActive.asStateFlow()
    
    private var monitoringJob: kotlinx.coroutines.Job? = null
    
    fun startEventMonitoring() {
        if (_isActive.value) {
            logger.info("Event monitoring already active")
            return
        }
        
        logger.info("Starting event monitoring for project: ${project.name}")
        _isActive.value = true
        
        monitoringJob = scope.launch {
            while (isActive && _isActive.value) {
                try {
                    // TODO: Implement actual event polling from Unhook API
                    // For now, simulate events
                    simulateEvents()
                    
                    _isConnected.value = true
                    
                    val appService = UnhookApplicationService.getInstance()
                    val pollInterval = appService.getPollIntervalMs()
                    delay(pollInterval)
                    
                } catch (e: Exception) {
                    logger.error("Error during event monitoring", e)
                    _isConnected.value = false
                    delay(5000) // Wait before retry
                }
            }
        }
    }
    
    fun stopEventMonitoring() {
        logger.info("Stopping event monitoring")
        _isActive.value = false
        _isConnected.value = false
        monitoringJob?.cancel()
        monitoringJob = null
    }
    
    fun refreshEvents() {
        scope.launch {
            try {
                // TODO: Implement actual event fetching from API
                logger.info("Refreshing events")
                simulateEvents()
            } catch (e: Exception) {
                logger.error("Error refreshing events", e)
            }
        }
    }
    
    fun clearEvents() {
        _events.value = emptyList()
        logger.info("Cleared all events")
    }
    
    fun replayEvent(eventId: String) {
        scope.launch {
            try {
                val event = _events.value.find { it.id == eventId }
                if (event != null) {
                    logger.info("Replaying event: $eventId")
                    // TODO: Implement actual event replay
                } else {
                    logger.warn("Event not found for replay: $eventId")
                }
            } catch (e: Exception) {
                logger.error("Error replaying event", e)
            }
        }
    }
    
    fun isActive(): Boolean = _isActive.value
    
    private fun simulateEvents() {
        // Simulate receiving webhook events for demo purposes
        val currentEvents = _events.value.toMutableList()
        
        // Add a new simulated event occasionally
        if (currentEvents.size < 5 && Math.random() < 0.3) {
            val newEvent = WebhookEvent(
                id = UUID.randomUUID().toString(),
                url = "https://unhook.sh/wh_${UUID.randomUUID().toString().take(8)}",
                method = "POST",
                headers = mapOf(
                    "Content-Type" to "application/json",
                    "User-Agent" to "Stripe/1.0",
                    "X-Stripe-Event-Type" to "payment_intent.succeeded"
                ),
                body = """{"id": "evt_${UUID.randomUUID().toString().take(8)}", "type": "payment_intent.succeeded"}""",
                timestamp = Instant.now().toString(),
                provider = "Stripe",
                eventType = "payment_intent.succeeded",
                statusCode = 200,
                responseTime = (50..200).random().toLong(),
                delivered = true
            )
            
            currentEvents.add(0, newEvent) // Add to beginning
            
            // Limit to max history
            val appService = UnhookApplicationService.getInstance()
            val maxHistory = appService.getMaxEventHistory()
            if (currentEvents.size > maxHistory) {
                currentEvents.removeAll(currentEvents.drop(maxHistory))
            }
            
            _events.value = currentEvents
        }
    }
    
    fun dispose() {
        stopEventMonitoring()
    }
}