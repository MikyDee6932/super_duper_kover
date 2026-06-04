package com.kover.dns

import android.content.Context

class BlocklistManager(private val context: Context) {

    private val blockedDomains: HashSet<String> by lazy { loadBlocklist() }

    private fun loadBlocklist(): HashSet<String> {
        val set = HashSet<String>(250000)
        try {
            context.assets.open("blocklist/unified-hosts.txt").bufferedReader().forEachLine { line ->
                val trimmed = line.trim()
                if (trimmed.startsWith("#") || trimmed.isEmpty()) return@forEachLine
                val parts = trimmed.split("\\s+".toRegex())
                if (parts.size >= 2) {
                    set.add(parts[1].lowercase())
                }
            }
        } catch (e: Exception) {
            // Asset not found — start with empty set
        }
        return set
    }

    fun isBlocked(domain: String): Boolean {
        val lower = domain.lowercase().trimEnd('.')
        if (blockedDomains.contains(lower)) return true
        // Check parent domains
        val parts = lower.split(".")
        for (i in 1 until parts.size - 1) {
            if (blockedDomains.contains(parts.drop(i).joinToString("."))) return true
        }
        return false
    }
}
