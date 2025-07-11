package sh.unhook.jetbrains.settings

import com.intellij.openapi.options.Configurable
import com.intellij.openapi.options.ConfigurationException
import com.intellij.ui.components.JBCheckBox
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBTextField
import com.intellij.util.ui.FormBuilder
import sh.unhook.jetbrains.services.UnhookApplicationService
import javax.swing.JComponent

class UnhookSettingsConfigurable : Configurable {
    
    private var settingsComponent: UnhookSettingsComponent? = null
    
    override fun getDisplayName(): String = "Unhook"
    
    override fun createComponent(): JComponent {
        val component = UnhookSettingsComponent()
        settingsComponent = component
        return component.panel
    }
    
    override fun isModified(): Boolean {
        val settings = UnhookApplicationService.getInstance()
        val component = settingsComponent ?: return false
        
        return component.deliveryEnabled != settings.isDeliveryEnabled() ||
               component.maxEventHistory != settings.getMaxEventHistory() ||
               component.pollInterval != settings.getPollIntervalMs() ||
               component.showNotifications != settings.isShowNotifications() ||
               component.autoShowOutput != settings.isAutoShowOutput() ||
               component.apiUrl != settings.getApiUrl()
    }
    
    @Throws(ConfigurationException::class)
    override fun apply() {
        val settings = UnhookApplicationService.getInstance()
        val component = settingsComponent ?: return
        
        settings.setDeliveryEnabled(component.deliveryEnabled)
        settings.setMaxEventHistory(component.maxEventHistory)
        settings.setPollIntervalMs(component.pollInterval)
        settings.setShowNotifications(component.showNotifications)
        settings.setAutoShowOutput(component.autoShowOutput)
        settings.setApiUrl(component.apiUrl)
    }
    
    override fun reset() {
        val settings = UnhookApplicationService.getInstance()
        val component = settingsComponent ?: return
        
        component.deliveryEnabled = settings.isDeliveryEnabled()
        component.maxEventHistory = settings.getMaxEventHistory()
        component.pollInterval = settings.getPollIntervalMs()
        component.showNotifications = settings.isShowNotifications()
        component.autoShowOutput = settings.isAutoShowOutput()
        component.apiUrl = settings.getApiUrl()
    }
    
    override fun disposeUIResources() {
        settingsComponent = null
    }
    
    private class UnhookSettingsComponent {
        val panel: JComponent
        
        private val deliveryEnabledCheckBox = JBCheckBox("Enable webhook event forwarding")
        private val maxEventHistoryField = JBTextField()
        private val pollIntervalField = JBTextField()
        private val showNotificationsCheckBox = JBCheckBox("Show notifications for new events")
        private val autoShowOutputCheckBox = JBCheckBox("Automatically show output panel")
        private val apiUrlField = JBTextField()
        
        init {
            panel = FormBuilder.createFormBuilder()
                .addComponent(JBLabel("General Settings"))
                .addComponent(deliveryEnabledCheckBox)
                .addComponent(showNotificationsCheckBox)
                .addComponent(autoShowOutputCheckBox)
                .addLabeledComponent("API URL:", apiUrlField)
                .addLabeledComponent("Max event history:", maxEventHistoryField)
                .addLabeledComponent("Poll interval (ms):", pollIntervalField)
                .addComponentFillVertically(JBLabel(""), 0)
                .panel
        }
        
        var deliveryEnabled: Boolean
            get() = deliveryEnabledCheckBox.isSelected
            set(value) { deliveryEnabledCheckBox.isSelected = value }
        
        var maxEventHistory: Int
            get() = maxEventHistoryField.text.toIntOrNull() ?: 100
            set(value) { maxEventHistoryField.text = value.toString() }
        
        var pollInterval: Long
            get() = pollIntervalField.text.toLongOrNull() ?: 2000L
            set(value) { pollIntervalField.text = value.toString() }
        
        var showNotifications: Boolean
            get() = showNotificationsCheckBox.isSelected
            set(value) { showNotificationsCheckBox.isSelected = value }
        
        var autoShowOutput: Boolean
            get() = autoShowOutputCheckBox.isSelected
            set(value) { autoShowOutputCheckBox.isSelected = value }
        
        var apiUrl: String
            get() = apiUrlField.text
            set(value) { apiUrlField.text = value }
    }
}