package sh.unhook.jetbrains.listeners

import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.project.Project
import com.intellij.openapi.project.ProjectManagerListener
import sh.unhook.jetbrains.services.UnhookProjectService

class UnhookProjectListener : ProjectManagerListener {
    
    private val logger = thisLogger()
    
    override fun projectOpened(project: Project) {
        logger.info("Project opened: ${project.name}")
        
        // Initialize project service and start monitoring if configured
        val projectService = UnhookProjectService.getInstance(project)
        if (projectService.hasValidConfig()) {
            logger.info("Valid configuration found, starting event monitoring")
            projectService.startEventMonitoring()
        }
    }
    
    override fun projectClosed(project: Project) {
        logger.info("Project closed: ${project.name}")
        
        // Stop monitoring and cleanup
        val projectService = UnhookProjectService.getInstance(project)
        projectService.stopEventMonitoring()
    }
}