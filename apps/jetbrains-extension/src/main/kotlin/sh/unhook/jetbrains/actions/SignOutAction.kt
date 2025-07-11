package sh.unhook.jetbrains.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.ui.Messages
import sh.unhook.jetbrains.services.UnhookApplicationService

class SignOutAction : AnAction() {
    
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val appService = UnhookApplicationService.getInstance()
        
        val result = Messages.showYesNoDialog(
            project,
            "Are you sure you want to sign out of Unhook?",
            "Sign Out",
            Messages.getQuestionIcon()
        )
        
        if (result == Messages.YES) {
            appService.authManager.signOut()
            
            Messages.showInfoMessage(
                project,
                "Successfully signed out of Unhook.",
                "Sign Out Successful"
            )
        }
    }
    
    override fun update(e: AnActionEvent) {
        val appService = UnhookApplicationService.getInstance()
        val isSignedIn = appService.authManager.isSignedIn()
        
        e.presentation.isEnabled = isSignedIn
        e.presentation.isVisible = true
    }
}