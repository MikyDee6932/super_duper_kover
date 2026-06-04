#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(KoverDNS, NSObject)

RCT_EXTERN_METHOD(installDNSProfile:(NSString *)nextDNSProfileId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(isProfileEnabled:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
