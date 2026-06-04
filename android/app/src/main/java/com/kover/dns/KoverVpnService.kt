package com.kover.dns

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import kotlinx.coroutines.*
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.InetAddress

class KoverVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private var job: Job? = null
    private var nextDnsProfileId: String? = null

    companion object {
        const val ACTION_START = "com.kover.dns.START"
        const val ACTION_STOP = "com.kover.dns.STOP"
        const val EXTRA_PROFILE_ID = "profile_id"
        const val CHANNEL_ID = "kover_shield"
        const val NOTIFICATION_ID = 1001
        var isRunning = false
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopVpn()
            return START_NOT_STICKY
        }

        nextDnsProfileId = intent?.getStringExtra(EXTRA_PROFILE_ID)

        // Persist profile ID so KoverBootReceiver can restart Shield after reboot
        if (nextDnsProfileId != null) {
            getSharedPreferences("KoverShield", MODE_PRIVATE).edit()
                .putString("nextdns_profile_id", nextDnsProfileId)
                .apply()
        }

        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
        startVpn()
        isRunning = true
        return START_STICKY
    }

    private fun startVpn() {
        val builder = Builder()
            .setSession("Kover Shield")
            .addAddress("10.0.0.1", 24)
            .addRoute("0.0.0.0", 0)
            .addDnsServer("45.90.28.0")   // NextDNS fallback
            .addDnsServer("45.90.30.0")
            .setMtu(1500)

        vpnInterface = builder.establish()
        val fd = vpnInterface?.fileDescriptor ?: return

        val interceptor = DnsInterceptor(this, nextDnsProfileId ?: "")

        job = CoroutineScope(Dispatchers.IO).launch {
            val input = FileInputStream(fd)
            val output = FileOutputStream(fd)
            val buffer = ByteArray(32767)

            while (isActive) {
                val length = try { input.read(buffer) } catch (e: Exception) { break }
                if (length <= 0) continue

                val packet = buffer.copyOf(length)
                val response = interceptor.intercept(packet)
                if (response != null) {
                    output.write(response)
                }
            }
        }
    }

    private fun stopVpn() {
        isRunning = false
        job?.cancel()
        vpnInterface?.close()
        vpnInterface = null
        stopForeground(true)
        stopSelf()
    }

    override fun onDestroy() {
        stopVpn()
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Kover Shield",
                NotificationManager.IMPORTANCE_LOW,
            ).apply { description = "Active content filtering" }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }
        return builder
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentTitle("Kover Shield Active")
            .setContentText("Content filtering is protecting you")
            .setOngoing(true)
            .build()
    }
}
