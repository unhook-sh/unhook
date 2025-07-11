package sh.unhook.jetbrains.statusbar

import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.StatusBar
import com.intellij.openapi.wm.StatusBarWidget
import com.intellij.openapi.wm.StatusBarWidgetFactory
import org.jetbrains.annotations.Nls

class UnhookStatusBarWidgetFactory : StatusBarWidgetFactory {
    
    override fun getId(): String = "UnhookStatusWidget"
    
    override fun getDisplayName(): String = "Unhook"
    
    override fun isAvailable(project: Project): Boolean = true
    
    override fun createWidget(project: Project): StatusBarWidget {
        return UnhookStatusBarWidget(project)
    }
    
    override fun disposeWidget(widget: StatusBarWidget) {
        // Widget cleanup if needed
    }
    
    override fun canBeEnabledOn(statusBar: StatusBar): Boolean = true
}