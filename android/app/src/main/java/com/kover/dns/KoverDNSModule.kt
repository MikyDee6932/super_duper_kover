package com.kover.dns

import android.content.Intent
import android.net.VpnService
import com.facebook.react.bridge.*

class KoverDNSModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "KoverDNS"

    @ReactMethod
    fun startVpnService(nextDNSProfileId: String, promise: Promise) {
        try {
            val intent = VpnService.prepare(reactContext)
            if (intent != null) {
                // Need user permission first — return a specific error code
                promise.reject("PERMISSION_REQUIRED", "VPN permission required")
                return
            }

            val serviceIntent = Intent(reactContext, KoverVpnService::class.java).apply {
                action = KoverVpnService.ACTION_START
                putExtra(KoverVpnService.EXTRA_PROFILE_ID, nextDNSProfileId)
            }
            reactContext.startService(serviceIntent)
            promise.resolve("success")
        } catch (e: Exception) {
            promise.reject("VPN_ERROR", e.message, e)
        }
    }

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

    // iOS stubs (no-op on Android)
    @ReactMethod
    fun installDNSProfile(profileId: String, promise: Promise) { promise.resolve(false) }

    @ReactMethod
    fun isProfileEnabled(promise: Promise) { promise.resolve(false) }
}
