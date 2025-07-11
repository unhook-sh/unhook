package sh.unhook.jetbrains.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import sh.unhook.jetbrains.services.UnhookProjectService

class RefreshEventsAction : AnAction() {
    
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val projectService = UnhookProjectService.getInstance(project)
        
        projectService.refreshEvents()
    }
    
    override fun update(e: AnActionEvent) {
        val project = e.project
        e.presentation.isEnabled = project != null
    }
}