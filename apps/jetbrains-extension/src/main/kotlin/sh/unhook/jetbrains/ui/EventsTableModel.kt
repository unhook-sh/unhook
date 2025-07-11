package sh.unhook.jetbrains.ui

import sh.unhook.jetbrains.models.WebhookEvent
import javax.swing.table.AbstractTableModel

class EventsTableModel : AbstractTableModel() {
    
    private val events = mutableListOf<WebhookEvent>()
    
    private val columns = arrayOf(
        "Time",
        "Provider",
        "Event Type",
        "Method",
        "Status",
        "Response Time"
    )
    
    fun updateEvents(newEvents: List<WebhookEvent>) {
        events.clear()
        events.addAll(newEvents)
        fireTableDataChanged()
    }
    
    fun getEventAt(row: Int): WebhookEvent? {
        return if (row >= 0 && row < events.size) {
            events[row]
        } else {
            null
        }
    }
    
    override fun getRowCount(): Int = events.size
    
    override fun getColumnCount(): Int = columns.size
    
    override fun getColumnName(columnIndex: Int): String = columns[columnIndex]
    
    override fun getValueAt(rowIndex: Int, columnIndex: Int): Any? {
        if (rowIndex >= events.size) return null
        
        val event = events[rowIndex]
        return when (columnIndex) {
            0 -> event.formattedTimestamp
            1 -> event.provider ?: "Unknown"
            2 -> event.eventType ?: "Unknown"
            3 -> event.method
            4 -> event.statusCode?.toString() ?: "N/A"
            5 -> event.responseTime?.let { "${it}ms" } ?: "N/A"
            else -> null
        }
    }
    
    override fun getColumnClass(columnIndex: Int): Class<*> {
        return String::class.java
    }
    
    override fun isCellEditable(rowIndex: Int, columnIndex: Int): Boolean = false
}