package sh.unhook.jetbrains.ui

import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBPanel
import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.components.JBTextArea
import com.intellij.util.ui.JBUI
import sh.unhook.jetbrains.models.WebhookEvent
import java.awt.BorderLayout
import java.awt.Font
import java.awt.GridBagConstraints
import java.awt.GridBagLayout
import javax.swing.BorderFactory
import javax.swing.JComponent
import javax.swing.JPanel
import javax.swing.JSeparator

class EventDetailsPanel : JBPanel<EventDetailsPanel>(BorderLayout()) {
    
    private val headerPanel = JBPanel<JBPanel<*>>(GridBagLayout())
    private val bodyPanel = JBPanel<JBPanel<*>>(BorderLayout())
    private val bodyTextArea = JBTextArea()
    
    init {
        setupUI()
    }
    
    private fun setupUI() {
        border = JBUI.Borders.empty(5)
        
        // Header panel with event details
        headerPanel.border = BorderFactory.createTitledBorder("Event Details")
        add(headerPanel, BorderLayout.NORTH)
        
        // Body panel with JSON content
        bodyPanel.border = BorderFactory.createTitledBorder("Request Body")
        bodyTextArea.isEditable = false
        bodyTextArea.font = Font(Font.MONOSPACED, Font.PLAIN, 12)
        bodyTextArea.lineWrap = true
        bodyTextArea.wrapStyleWord = true
        
        val scrollPane = JBScrollPane(bodyTextArea)
        scrollPane.verticalScrollBarPolicy = JBScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED
        scrollPane.horizontalScrollBarPolicy = JBScrollPane.HORIZONTAL_SCROLLBAR_AS_NEEDED
        
        bodyPanel.add(scrollPane, BorderLayout.CENTER)
        add(bodyPanel, BorderLayout.CENTER)
        
        // Initially show empty state
        showEmptyState()
    }
    
    fun displayEvent(event: WebhookEvent) {
        headerPanel.removeAll()
        
        val gbc = GridBagConstraints()
        gbc.anchor = GridBagConstraints.WEST
        gbc.insets = JBUI.insets(2)
        
        // Row 0: ID and Timestamp
        gbc.gridx = 0; gbc.gridy = 0
        headerPanel.add(JBLabel("ID:"), gbc)
        gbc.gridx = 1
        headerPanel.add(JBLabel(event.id), gbc)
        
        gbc.gridx = 2
        headerPanel.add(JBLabel("Time:"), gbc)
        gbc.gridx = 3
        headerPanel.add(JBLabel(event.formattedTimestamp), gbc)
        
        // Row 1: Provider and Event Type
        gbc.gridx = 0; gbc.gridy = 1
        headerPanel.add(JBLabel("Provider:"), gbc)
        gbc.gridx = 1
        headerPanel.add(JBLabel(event.provider ?: "Unknown"), gbc)
        
        gbc.gridx = 2
        headerPanel.add(JBLabel("Event Type:"), gbc)
        gbc.gridx = 3
        headerPanel.add(JBLabel(event.eventType ?: "Unknown"), gbc)
        
        // Row 2: Method and Status
        gbc.gridx = 0; gbc.gridy = 2
        headerPanel.add(JBLabel("Method:"), gbc)
        gbc.gridx = 1
        headerPanel.add(JBLabel(event.method), gbc)
        
        gbc.gridx = 2
        headerPanel.add(JBLabel("Status:"), gbc)
        gbc.gridx = 3
        val statusLabel = JBLabel(event.statusCode?.toString() ?: "N/A")
        if (event.isError) {
            statusLabel.foreground = JBUI.CurrentTheme.Label.errorForeground()
        } else if (event.isSuccess) {
            statusLabel.foreground = JBUI.CurrentTheme.Label.successForeground()
        }
        headerPanel.add(statusLabel, gbc)
        
        // Row 3: URL
        gbc.gridx = 0; gbc.gridy = 3
        headerPanel.add(JBLabel("URL:"), gbc)
        gbc.gridx = 1; gbc.gridwidth = 3
        headerPanel.add(JBLabel(event.url), gbc)
        
        // Row 4: Headers
        gbc.gridx = 0; gbc.gridy = 4; gbc.gridwidth = 1
        headerPanel.add(JBLabel("Headers:"), gbc)
        gbc.gridx = 1; gbc.gridwidth = 3
        
        val headersText = event.headers.entries.joinToString("\n") { "${it.key}: ${it.value}" }
        val headersArea = JBTextArea(headersText)
        headersArea.isEditable = false
        headersArea.font = Font(Font.MONOSPACED, Font.PLAIN, 11)
        headersArea.rows = Math.min(event.headers.size, 5)
        headerPanel.add(JBScrollPane(headersArea), gbc)
        
        // Update body
        bodyTextArea.text = if (event.hasBody) {
            formatJson(event.body)
        } else {
            "(No body)"
        }
        
        headerPanel.revalidate()
        headerPanel.repaint()
    }
    
    fun clearEvent() {
        showEmptyState()
    }
    
    private fun showEmptyState() {
        headerPanel.removeAll()
        
        val gbc = GridBagConstraints()
        gbc.anchor = GridBagConstraints.CENTER
        gbc.gridx = 0
        gbc.gridy = 0
        
        headerPanel.add(JBLabel("Select an event to view details"), gbc)
        
        bodyTextArea.text = ""
        
        headerPanel.revalidate()
        headerPanel.repaint()
    }
    
    private fun formatJson(jsonString: String): String {
        return try {
            // TODO: Implement proper JSON formatting
            jsonString
        } catch (e: Exception) {
            jsonString
        }
    }
}