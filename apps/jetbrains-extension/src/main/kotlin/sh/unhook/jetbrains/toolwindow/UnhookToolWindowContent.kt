package sh.unhook.jetbrains.toolwindow

import com.intellij.openapi.actionSystem.ActionManager
import com.intellij.openapi.actionSystem.DefaultActionGroup
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.SimpleToolWindowPanel
import com.intellij.ui.OnePixelSplitter
import com.intellij.ui.ScrollPaneFactory
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBPanel
import com.intellij.ui.table.JBTable
import com.intellij.util.ui.JBUI
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.swing.Swing
import sh.unhook.jetbrains.models.WebhookEvent
import sh.unhook.jetbrains.services.UnhookProjectService
import sh.unhook.jetbrains.ui.EventDetailsPanel
import sh.unhook.jetbrains.ui.EventsTableModel
import java.awt.BorderLayout
import java.awt.Component
import javax.swing.JComponent
import javax.swing.ListSelectionModel
import javax.swing.event.ListSelectionEvent

class UnhookToolWindowContent(
    private val project: Project,
    private val projectService: UnhookProjectService
) {
    
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Swing)
    private val panel = SimpleToolWindowPanel(true, true)
    
    private val eventsTableModel = EventsTableModel()
    private val eventsTable = JBTable(eventsTableModel)
    private val eventDetailsPanel = EventDetailsPanel()
    
    init {
        setupUI()
        setupEventListeners()
    }
    
    private fun setupUI() {
        // Configure table
        eventsTable.selectionModel.selectionMode = ListSelectionModel.SINGLE_SELECTION
        eventsTable.selectionModel.addListSelectionListener { e: ListSelectionEvent ->
            if (!e.valueIsAdjusting) {
                val selectedRow = eventsTable.selectedRow
                if (selectedRow >= 0) {
                    val event = eventsTableModel.getEventAt(selectedRow)
                    eventDetailsPanel.displayEvent(event)
                } else {
                    eventDetailsPanel.clearEvent()
                }
            }
        }
        
        // Create toolbar
        val actionGroup = DefaultActionGroup()
        actionGroup.add(ActionManager.getInstance().getAction("Unhook.RefreshEvents"))
        actionGroup.add(ActionManager.getInstance().getAction("Unhook.ClearEvents"))
        actionGroup.addSeparator()
        actionGroup.add(ActionManager.getInstance().getAction("Unhook.ToggleDelivery"))
        
        val toolbar = ActionManager.getInstance().createActionToolbar("UnhookToolbar", actionGroup, true)
        toolbar.targetComponent = panel
        panel.setToolbar(toolbar.component)
        
        // Create main content with splitter
        val splitter = OnePixelSplitter(true, 0.6f)
        
        // Events table in scroll pane
        val eventsScrollPane = ScrollPaneFactory.createScrollPane(eventsTable)
        splitter.firstComponent = eventsScrollPane
        
        // Event details panel
        splitter.secondComponent = eventDetailsPanel
        
        // Add connection status
        val statusPanel = createStatusPanel()
        val mainPanel = JBPanel<JBPanel<*>>(BorderLayout())
        mainPanel.add(statusPanel, BorderLayout.NORTH)
        mainPanel.add(splitter, BorderLayout.CENTER)
        
        panel.setContent(mainPanel)
    }
    
    private fun createStatusPanel(): JComponent {
        val statusPanel = JBPanel<JBPanel<*>>(BorderLayout())
        statusPanel.border = JBUI.Borders.empty(5)
        
        val statusLabel = JBLabel("Status: Disconnected")
        statusPanel.add(statusLabel, BorderLayout.WEST)
        
        // Update status based on service state
        projectService.connectionStatus
            .onEach { status ->
                ApplicationManager.getApplication().invokeLater {
                    statusLabel.text = "Status: $status"
                }
            }
            .launchIn(scope)
        
        return statusPanel
    }
    
    private fun setupEventListeners() {
        // Listen for events updates
        projectService.events
            .onEach { events ->
                ApplicationManager.getApplication().invokeLater {
                    eventsTableModel.updateEvents(events)
                }
            }
            .launchIn(scope)
    }
    
    fun getContent(): JComponent = panel
    
    fun dispose() {
        scope.cancel()
    }
}