package sh.unhook.jetbrains.services

import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.util.xmlb.XmlSerializerUtil
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import sh.unhook.jetbrains.auth.UnhookAuthManager
import sh.unhook.jetbrains.config.UnhookSettings

@Service(Service.Level.APP)
@State(name = "UnhookApplicationService", storages = [Storage("unhook.xml")])
class UnhookApplicationService : PersistentStateComponent<UnhookApplicationService.State> {

    private val logger = thisLogger()
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private var state = State()

    val authManager = UnhookAuthManager()
    val settings = UnhookSettings()

    data class State(
        var isFirstRun: Boolean = true,
        var apiUrl: String = "https://unhook.sh",
        var deliveryEnabled: Boolean = true,
        var maxEventHistory: Int = 100,
        var pollIntervalMs: Long = 2000,
        var showNotifications: Boolean = true,
        var autoShowOutput: Boolean = false
    )

    override fun getState(): State = state

    override fun loadState(loadedState: State) {
        XmlSerializerUtil.copyBean(loadedState, state)
        settings.updateFromState(state)
    }

    fun isFirstRun(): Boolean = state.isFirstRun

    fun setFirstRunComplete() {
        state.isFirstRun = false
    }

    fun getApiUrl(): String = state.apiUrl

    fun setApiUrl(url: String) {
        state.apiUrl = url
    }

    fun isDeliveryEnabled(): Boolean = state.deliveryEnabled

    fun setDeliveryEnabled(enabled: Boolean) {
        state.deliveryEnabled = enabled
    }

    fun getMaxEventHistory(): Int = state.maxEventHistory

    fun setMaxEventHistory(max: Int) {
        state.maxEventHistory = max
    }

    fun getPollIntervalMs(): Long = state.pollIntervalMs

    fun setPollIntervalMs(interval: Long) {
        state.pollIntervalMs = interval
    }

    fun isShowNotifications(): Boolean = state.showNotifications

    fun setShowNotifications(show: Boolean) {
        state.showNotifications = show
    }

    fun isAutoShowOutput(): Boolean = state.autoShowOutput

    fun setAutoShowOutput(show: Boolean) {
        state.autoShowOutput = show
    }

    fun dispose() {
        serviceScope.cancel()
        authManager.dispose()
    }

    companion object {
        fun getInstance(): UnhookApplicationService {
            return com.intellij.openapi.application.ApplicationManager.getApplication()
                .getService(UnhookApplicationService::class.java)
        }
    }
}