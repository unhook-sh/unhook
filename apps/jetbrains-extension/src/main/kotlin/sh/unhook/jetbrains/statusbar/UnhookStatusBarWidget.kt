package sh.unhook.jetbrains.statusbar

import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.StatusBarWidget
import com.intellij.openapi.wm.impl.status.EditorBasedWidget
import com.intellij.util.Consumer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.swing.Swing
import sh.unhook.jetbrains.services.UnhookApplicationService
import sh.unhook.jetbrains.services.UnhookProjectService
import java.awt.event.MouseEvent

class UnhookStatusBarWidget(private val project: Project) : EditorBasedWidget(project), StatusBarWidget.MultipleTextValuesPresentation {
    
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Swing)
    
    private var currentText = "Unhook: Disconnected"
    private var currentTooltip = "Unhook webhook development tool"
    
    init {
        setupStatusUpdates()
    }
    
    private fun setupStatusUpdates() {
        val appService = UnhookApplicationService.getInstance()
        val projectService = UnhookProjectService.getInstance(project)
        
        // Listen for connection status changes
        projectService.connectionStatus
            .onEach { status ->
                updateStatus(status)
            }
            .launchIn(scope)
        
        // Listen for auth changes
        appService.authManager.isSignedIn
            .onEach { isSignedIn ->
                updateAuthStatus(isSignedIn)
            }
            .launchIn(scope)
    }
    
    private fun updateStatus(connectionStatus: String) {
        val appService = UnhookApplicationService.getInstance()
        val isSignedIn = appService.authManager.isSignedIn()
        val deliveryEnabled = appService.isDeliveryEnabled()
        
        currentText = when {
            !isSignedIn -> "Unhook: Sign In Required"
            connectionStatus == "Connected" -> {
                if (deliveryEnabled) "Unhook: Active" else "Unhook: Paused"
            }
            else -> "Unhook: Disconnected"
        }
        
        currentTooltip = when {
            !isSignedIn -> "Click to sign in to Unhook"
            connectionStatus == "Connected" -> {
                if (deliveryEnabled) {
                    "Unhook is active and forwarding events • Click for options"
                } else {
                    "Unhook is connected but event forwarding is paused • Click for options"
                }
            }
            else -> "Unhook is disconnected • Click for options"
        }
        
        myStatusBar?.updateWidget(ID())
    }
    
    private fun updateAuthStatus(isSignedIn: Boolean) {
        if (!isSignedIn) {
            currentText = "Unhook: Sign In Required"
            currentTooltip = "Click to sign in to Unhook"
            myStatusBar?.updateWidget(ID())
        }
    }
    
    override fun ID(): String = "UnhookStatusWidget"
    
    override fun getPresentation(): StatusBarWidget.WidgetPresentation {
        return this
    }
    
    override fun getSelectedValue(): String = currentText
    
    override fun getTooltipText(): String = currentTooltip
    
    override fun getClickConsumer(): Consumer<MouseEvent>? {
        return Consumer { _ ->
            // TODO: Show quick actions popup or open tool window
            val projectService = UnhookProjectService.getInstance(project)
            projectService.startEventMonitoring()
        }
    }
    
    override fun dispose() {
        scope.cancel()
        super.dispose()
    }
}