package sh.unhook.jetbrains.toolwindow

import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.content.ContentFactory
import sh.unhook.jetbrains.services.UnhookProjectService

class UnhookToolWindowFactory : ToolWindowFactory {
    
    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        val projectService = UnhookProjectService.getInstance(project)
        val toolWindowContent = UnhookToolWindowContent(project, projectService)
        
        val contentFactory = ContentFactory.getInstance()
        val content = contentFactory.createContent(toolWindowContent.getContent(), "", false)
        
        toolWindow.contentManager.addContent(content)
    }
    
    override fun shouldBeAvailable(project: Project): Boolean = true
}