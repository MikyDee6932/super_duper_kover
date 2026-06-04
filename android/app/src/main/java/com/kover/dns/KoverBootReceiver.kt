package com.kover.dns

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.VpnService

/**
 * KoverBootReceiver
 *
 * Listens for BOOT_COMPLETED and MY_PACKAGE_REPLACED broadcasts.
 * If VPN permission was previously granted, restarts Kover Shield automatically
 * so the content filter is active immediately after every device reboot or app update.
 *
 * Note: VpnService.prepare() returns null if permission is already granted,
 * meaning we can restart silently without showing the system VPN dialog again.
 */
class KoverBootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val validActions = setOf(
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
        )
        if (intent.action !in validActions) return

        // Only restart if VPN permission is already granted (prepare() returns null)
        if (VpnService.prepare(context) != null) return

        // Retrieve stored NextDNS profile ID from SharedPreferences
        val prefs = context.getSharedPreferences("KoverShield", Context.MODE_PRIVATE)
        val profileId = prefs.getString("nextdns_profile_id", null) ?: return

        val serviceIntent = Intent(context, KoverVpnService::class.java).apply {
            action = KoverVpnService.ACTION_START
            putExtra(KoverVpnService.EXTRA_PROFILE_ID, profileId)
        }

        context.startForegroundService(serviceIntent)
    }
}
