package sh.unhook.jetbrains.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.ui.Messages
import sh.unhook.jetbrains.services.UnhookProjectService

class ClearEventsAction : AnAction() {
    
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val projectService = UnhookProjectService.getInstance(project)
        
        val result = Messages.showYesNoDialog(
            project,
            "Are you sure you want to clear all webhook events?",
            "Clear Events",
            Messages.getQuestionIcon()
        )
        
        if (result == Messages.YES) {
            projectService.clearEvents()
        }
    }
    
    override fun update(e: AnActionEvent) {
        val project = e.project
        e.presentation.isEnabled = project != null
    }
}