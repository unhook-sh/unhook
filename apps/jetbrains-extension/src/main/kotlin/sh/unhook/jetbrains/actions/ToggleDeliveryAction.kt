package sh.unhook.jetbrains.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.Presentation
import com.intellij.openapi.actionSystem.ex.ActionUtil
import sh.unhook.jetbrains.services.UnhookApplicationService

class ToggleDeliveryAction : AnAction() {
    
    override fun actionPerformed(e: AnActionEvent) {
        val appService = UnhookApplicationService.getInstance()
        val currentState = appService.isDeliveryEnabled()
        appService.setDeliveryEnabled(!currentState)
        
        // Update the action presentation
        update(e)
    }
    
    override fun update(e: AnActionEvent) {
        val appService = UnhookApplicationService.getInstance()
        val deliveryEnabled = appService.isDeliveryEnabled()
        
        val presentation = e.presentation
        if (deliveryEnabled) {
            presentation.text = "Disable Event Forwarding"
            presentation.description = "Disable webhook event forwarding to local endpoints"
        } else {
            presentation.text = "Enable Event Forwarding"
            presentation.description = "Enable webhook event forwarding to local endpoints"
        }
        
        presentation.isEnabled = true
    }
}