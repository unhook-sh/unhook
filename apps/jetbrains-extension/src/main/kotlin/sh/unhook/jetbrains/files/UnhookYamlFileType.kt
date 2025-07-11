package sh.unhook.jetbrains.files

import com.intellij.openapi.fileTypes.FileType
import com.intellij.openapi.vfs.VirtualFile
import javax.swing.Icon

class UnhookYamlFileType : FileType {
    
    companion object {
        @JvmStatic
        val INSTANCE = UnhookYamlFileType()
    }
    
    override fun getName(): String = "Unhook YAML"
    
    override fun getDescription(): String = "Unhook configuration file"
    
    override fun getDefaultExtension(): String = "yaml"
    
    override fun getIcon(): Icon? = null // TODO: Add custom icon if needed
    
    override fun isBinary(): Boolean = false
    
    override fun isReadOnly(): Boolean = false
    
    override fun getCharset(file: VirtualFile, content: ByteArray): String? = null
}