package sh.unhook.jetbrains.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.progress.ProgressIndicator
import com.intellij.openapi.progress.ProgressManager
import com.intellij.openapi.progress.Task
import com.intellij.openapi.ui.Messages
import sh.unhook.jetbrains.services.UnhookApplicationService

class SignInAction : AnAction() {
    
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val appService = UnhookApplicationService.getInstance()
        
        ProgressManager.getInstance().run(object : Task.Backgroundable(project, "Signing in to Unhook...", true) {
            override fun run(indicator: ProgressIndicator) {
                try {
                    indicator.text = "Opening browser for authentication..."
                    
                    // TODO: Implement actual authentication flow
                    // For now, simulate the process
                    Thread.sleep(2000)
                    
                    if (indicator.isCanceled) {
                        return
                    }
                    
                    // Simulate successful authentication
                    appService.authManager.setSignedIn(true)
                    
                    // Show success message
                    Messages.showInfoMessage(
                        project,
                        "Successfully signed in to Unhook!",
                        "Authentication Successful"
                    )
                    
                } catch (e: Exception) {
                    Messages.showErrorDialog(
                        project,
                        "Failed to sign in: ${e.message}",
                        "Authentication Error"
                    )
                }
            }
        })
    }
    
    override fun update(e: AnActionEvent) {
        val appService = UnhookApplicationService.getInstance()
        val isSignedIn = appService.authManager.isSignedIn()
        
        e.presentation.isEnabled = !isSignedIn
        e.presentation.isVisible = true
    }
}