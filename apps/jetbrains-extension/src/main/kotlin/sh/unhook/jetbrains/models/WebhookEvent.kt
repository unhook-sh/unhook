package sh.unhook.jetbrains.models

import kotlinx.serialization.Serializable
import java.time.Instant
import java.time.format.DateTimeFormatter

@Serializable
data class WebhookEvent(
    val id: String,
    val url: String,
    val method: String,
    val headers: Map<String, String>,
    val body: String,
    val timestamp: String,
    val provider: String? = null,
    val eventType: String? = null,
    val statusCode: Int? = null,
    val responseTime: Long? = null,
    val delivered: Boolean = false,
    val deliveryError: String? = null
) {
    val formattedTimestamp: String
        get() = try {
            val instant = Instant.parse(timestamp)
            DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(instant.atZone(java.time.ZoneId.systemDefault()))
        } catch (e: Exception) {
            timestamp
        }
    
    val displayName: String
        get() = provider?.let { "$it - $eventType" } ?: eventType ?: "Webhook Event"
    
    val isSuccess: Boolean
        get() = statusCode?.let { it in 200..299 } ?: false
    
    val isError: Boolean
        get() = statusCode?.let { it >= 400 } ?: false
    
    val hasBody: Boolean
        get() = body.isNotEmpty()
    
    val contentType: String?
        get() = headers["content-type"] ?: headers["Content-Type"]
    
    val userAgent: String?
        get() = headers["user-agent"] ?: headers["User-Agent"]
    
    fun getHeaderValue(name: String): String? {
        return headers[name] ?: headers[name.lowercase()]
    }
}

@Serializable
data class WebhookEventRequest(
    val method: String,
    val url: String,
    val headers: Map<String, String>,
    val body: String
)

@Serializable
data class WebhookEventResponse(
    val statusCode: Int,
    val headers: Map<String, String>,
    val body: String,
    val responseTime: Long
)

@Serializable
data class WebhookEventFilter(
    val provider: String? = null,
    val eventType: String? = null,
    val method: String? = null,
    val statusCode: Int? = null,
    val searchText: String? = null,
    val dateFrom: String? = null,
    val dateTo: String? = null
) {
    fun matches(event: WebhookEvent): Boolean {
        if (provider != null && event.provider != provider) return false
        if (eventType != null && event.eventType != eventType) return false
        if (method != null && event.method != method) return false
        if (statusCode != null && event.statusCode != statusCode) return false
        if (searchText != null && !event.matchesSearchText(searchText)) return false
        // TODO: Add date filtering logic if needed
        return true
    }
}

private fun WebhookEvent.matchesSearchText(searchText: String): Boolean {
    val text = searchText.lowercase()
    return url.lowercase().contains(text) ||
           body.lowercase().contains(text) ||
           provider?.lowercase()?.contains(text) == true ||
           eventType?.lowercase()?.contains(text) == true ||
           headers.values.any { it.lowercase().contains(text) }
}