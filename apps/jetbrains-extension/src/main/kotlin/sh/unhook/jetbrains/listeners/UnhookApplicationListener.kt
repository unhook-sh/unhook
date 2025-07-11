package sh.unhook.jetbrains.listeners

import com.intellij.openapi.application.ApplicationActivationListener
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.wm.IdeFrame
import sh.unhook.jetbrains.services.UnhookApplicationService

class UnhookApplicationListener : ApplicationActivationListener {
    
    private val logger = thisLogger()
    
    override fun applicationActivated(ideFrame: IdeFrame) {
        logger.info("Application activated")
        
        // Initialize application service if needed
        val appService = UnhookApplicationService.getInstance()
        if (appService.isFirstRun()) {
            logger.info("First run detected")
            appService.setFirstRunComplete()
        }
    }
    
    override fun applicationDeactivated(ideFrame: IdeFrame) {
        logger.info("Application deactivated")
    }
}