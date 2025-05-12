// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');
const { withNativeWind }   = require('nativewind/metro');

// 1. Start from Expo’s default
const config = getDefaultConfig(__dirname);

// 2. Allow .cjs modules (Firebase, etc.) and disable strict exports
config.resolver.sourceExts = config.resolver.sourceExts || [];
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}
config.resolver.unstable_enablePackageExports = false;  // Expo SDK 53+ hack :contentReference[oaicite:3]{index=3}

// 3. Wrap with NativeWind so your globals.css is processed
module.exports = withNativeWind(config, {
  input: './app/globals.css',
});
