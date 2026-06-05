package com.kover.dns

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import android.os.Build
import com.facebook.react.bridge.*

/**
 * KoverDNSModule — React Native bridge for Kover Shield VPN on Android.
 *
 * Key fix: when VpnService.prepare() returns a non-null intent it means the
 * user hasn't yet granted VPN permission. We must call startActivityForResult()
 * to show the system dialog. The old code just rejected the promise, so the
 * dialog never appeared. We now implement ActivityEventListener to receive the
 * result and either start the service (RESULT_OK) or reject (user denied).
 */
class KoverDNSModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    companion object {
        private const val VPN_REQUEST_CODE = 0x0F00  // arbitrary unique code
    }

    // Held across the async activity result round-trip
    private var pendingPromise: Promise? = null
    private var pendingProfileId: String? = null

    init {
        // Register so onActivityResult fires when the VPN dialog is dismissed
        reactContext.addActivityEventListener(this)
    }

    override fun getName() = "KoverDNS"

    // ── Android VPN ───────────────────────────────────────────────────────────

    @ReactMethod
    fun startVpnService(nextDNSProfileId: String, promise: Promise) {
        try {
            val activity = currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No foreground activity — cannot show VPN dialog")
                return
            }

            val prepareIntent = VpnService.prepare(reactContext)

            if (prepareIntent != null) {
                // Permission not yet granted:
                // Save the promise and profile ID — they are resolved in onActivityResult
                pendingPromise = promise
                pendingProfileId = nextDNSProfileId
                // Shows the Android system "Connection request" VPN dialog
                activity.startActivityForResult(prepareIntent, VPN_REQUEST_CODE)
                // Do NOT resolve/reject the promise here — onActivityResult handles it
                return
            }

            // Permission already granted — start the service immediately
            launchService(nextDNSProfileId, promise)

        } catch (e: Exception) {
            promise.reject("VPN_ERROR", e.message ?: "Unknown error", e)
        }
    }

    /**
     * Called by the OS after the user taps Allow or Deny on the VPN dialog.
     */
    override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
    ) {
        if (requestCode != VPN_REQUEST_CODE) return

        val promise = pendingPromise ?: return
        val profileId = pendingProfileId

        // Clear held references before resolving
        pendingPromise = null
        pendingProfileId = null

        if (resultCode == Activity.RESULT_OK && profileId != null) {
            // User tapped Allow — launch the VPN service
            launchService(profileId, promise)
        } else {
            // User tapped Deny
            promise.reject("VPN_DENIED", "VPN permission denied by user")
        }
    }

    override fun onNewIntent(intent: Intent?) { /* no-op */ }

    @ReactMethod
    fun stopVpnService(promise: Promise) {
        val intent = Intent(reactContext, KoverVpnService::class.java).apply {
            action = KoverVpnService.ACTION_STOP
        }
        reactContext.startService(intent)
        promise.resolve("stopped")
    }

    @ReactMethod
    fun isVpnActive(promise: Promise) {
        promise.resolve(KoverVpnService.isRunning)
    }

    // ── iOS stubs (no-op on Android) ─────────────────────────────────────────

    @ReactMethod
    fun installDNSProfile(profileId: String, promise: Promise) {
        promise.resolve(false)
    }

    @ReactMethod
    fun isProfileEnabled(promise: Promise) {
        promise.resolve(false)
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Start KoverVpnService.
     * Uses startForegroundService() on Android 8+ because the service calls
     * startForeground() — using plain startService() would crash with a
     * ForegroundServiceDidNotStartInTimeException on API 26+.
     */
    private fun launchService(profileId: String, promise: Promise) {
        try {
            val serviceIntent = Intent(reactContext, KoverVpnService::class.java).apply {
                action = KoverVpnService.ACTION_START
                putExtra(KoverVpnService.EXTRA_PROFILE_ID, profileId)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(serviceIntent)
            } else {
                reactContext.startService(serviceIntent)
            }
            promise.resolve("success")
        } catch (e: Exception) {
            promise.reject("SERVICE_ERROR", e.message ?: "Failed to start VPN service", e)
        }
    }
}
