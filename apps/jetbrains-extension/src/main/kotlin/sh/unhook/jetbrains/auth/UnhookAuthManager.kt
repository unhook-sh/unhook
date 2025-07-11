package sh.unhook.jetbrains.auth

import com.intellij.openapi.diagnostic.thisLogger
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class UnhookAuthManager {
    
    private val logger = thisLogger()
    
    private val _isSignedIn = MutableStateFlow(false)
    val isSignedIn: StateFlow<Boolean> = _isSignedIn.asStateFlow()
    
    private val _user = MutableStateFlow<UnhookUser?>(null)
    val user: StateFlow<UnhookUser?> = _user.asStateFlow()
    
    private val _accessToken = MutableStateFlow<String?>(null)
    val accessToken: StateFlow<String?> = _accessToken.asStateFlow()
    
    fun isSignedIn(): Boolean = _isSignedIn.value
    
    fun setSignedIn(signedIn: Boolean) {
        _isSignedIn.value = signedIn
        logger.info("Auth state changed: signedIn=$signedIn")
    }
    
    fun setUser(user: UnhookUser?) {
        _user.value = user
        logger.info("User set: ${user?.email}")
    }
    
    fun setAccessToken(token: String?) {
        _accessToken.value = token
        logger.info("Access token ${if (token != null) "set" else "cleared"}")
    }
    
    fun signOut() {
        _isSignedIn.value = false
        _user.value = null
        _accessToken.value = null
        logger.info("User signed out")
    }
    
    fun getAuthHeaders(): Map<String, String> {
        val token = _accessToken.value
        return if (token != null) {
            mapOf("Authorization" to "Bearer $token")
        } else {
            emptyMap()
        }
    }
    
    fun dispose() {
        signOut()
    }
}

data class UnhookUser(
    val id: String,
    val email: String,
    val name: String?,
    val avatarUrl: String?
)