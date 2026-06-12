const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo config plugin: adds KoverVpnService + BootReceiver to AndroidManifest.xml
 *
 * Adds:
 *  - <service android:name=".dns.KoverVpnService" android:permission="android.permission.BIND_VPN_SERVICE" android:exported="true">
 *      <intent-filter><action android:name="android.net.VpnService" /></intent-filter>
 *    </service>
 *
 *  - <receiver android:name=".receivers.BootReceiver" android:exported="true">
 *      <intent-filter><action android:name="android.intent.action.BOOT_COMPLETED" /></intent-filter>
 *    </receiver>
 */
const withKoverVpnService = (config) => {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application[0];

    // ── VPN Service ──────────────────────────────────────────────────────────
    const vpnServiceExists = (application.service || []).some(
      (s) => s.$?.['android:name'] === '.dns.KoverVpnService'
    );

    if (!vpnServiceExists) {
      if (!application.service) application.service = [];
      application.service.push({
        $: {
          'android:name': '.dns.KoverVpnService',
          'android:permission': 'android.permission.BIND_VPN_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.net.VpnService' } }],
          },
        ],
      });
    }

    // ── Boot Receiver ────────────────────────────────────────────────────────
    const bootReceiverExists = (application.receiver || []).some(
      (r) => r.$?.['android:name'] === '.receivers.BootReceiver'
    );

    if (!bootReceiverExists) {
      if (!application.receiver) application.receiver = [];
      application.receiver.push({
        $: {
          'android:name': '.receivers.BootReceiver',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } },
            ],
          },
        ],
      });
    }

    return config;
  });
};

module.exports = withKoverVpnService;
