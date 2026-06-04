import Foundation
import NetworkExtension

@objc(KoverDNS)
class KoverDNSManager: NSObject {

  private let manager = NEDNSSettingsManager.shared()

  @objc func installDNSProfile(_ nextDNSProfileId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    manager.loadFromPreferences { error in
      if let error = error {
        reject("LOAD_ERROR", error.localizedDescription, error)
        return
      }

      let dohSettings = NEDNSOverHTTPSSettings(servers: ["https://dns.nextdns.io/\(nextDNSProfileId)"])

      let allNetworksRule = NEOnDemandRuleConnect()
      allNetworksRule.interfaceTypeMatch = .any
      dohSettings.onDemandRules = [allNetworksRule]

      self.manager.dnsSettings = dohSettings
      self.manager.localizedDescription = "Kover Shield"

      self.manager.saveToPreferences { saveError in
        if let saveError = saveError {
          reject("SAVE_ERROR", saveError.localizedDescription, saveError)
        } else {
          resolve("success")
        }
      }
    }
  }

  @objc func isProfileEnabled(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    manager.loadFromPreferences { error in
      if let error = error {
        reject("LOAD_ERROR", error.localizedDescription, error)
        return
      }
      resolve(self.manager.isEnabled && self.manager.dnsSettings != nil)
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc var methodQueue: DispatchQueue { .main }
}
