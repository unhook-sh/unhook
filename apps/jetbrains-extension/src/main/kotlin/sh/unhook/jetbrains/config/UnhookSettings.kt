package sh.unhook.jetbrains.config

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import sh.unhook.jetbrains.services.UnhookApplicationService

class UnhookSettings {
    
    private val _deliveryEnabled = MutableStateFlow(true)
    val deliveryEnabled: StateFlow<Boolean> = _deliveryEnabled.asStateFlow()
    
    private val _maxEventHistory = MutableStateFlow(100)
    val maxEventHistory: StateFlow<Int> = _maxEventHistory.asStateFlow()
    
    private val _pollIntervalMs = MutableStateFlow(2000L)
    val pollIntervalMs: StateFlow<Long> = _pollIntervalMs.asStateFlow()
    
    private val _showNotifications = MutableStateFlow(true)
    val showNotifications: StateFlow<Boolean> = _showNotifications.asStateFlow()
    
    private val _autoShowOutput = MutableStateFlow(false)
    val autoShowOutput: StateFlow<Boolean> = _autoShowOutput.asStateFlow()
    
    fun updateFromState(state: UnhookApplicationService.State) {
        _deliveryEnabled.value = state.deliveryEnabled
        _maxEventHistory.value = state.maxEventHistory
        _pollIntervalMs.value = state.pollIntervalMs
        _showNotifications.value = state.showNotifications
        _autoShowOutput.value = state.autoShowOutput
    }
    
    fun getDeliveryEnabled(): Boolean = _deliveryEnabled.value
    fun getMaxEventHistory(): Int = _maxEventHistory.value
    fun getPollIntervalMs(): Long = _pollIntervalMs.value
    fun getShowNotifications(): Boolean = _showNotifications.value
    fun getAutoShowOutput(): Boolean = _autoShowOutput.value
    
    fun setDeliveryEnabled(enabled: Boolean) {
        _deliveryEnabled.value = enabled
    }
    
    fun setMaxEventHistory(max: Int) {
        _maxEventHistory.value = max
    }
    
    fun setPollIntervalMs(interval: Long) {
        _pollIntervalMs.value = interval
    }
    
    fun setShowNotifications(show: Boolean) {
        _showNotifications.value = show
    }
    
    fun setAutoShowOutput(show: Boolean) {
        _autoShowOutput.value = show
    }
}