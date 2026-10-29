// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// `.jsonasset` files are JSON shipped as raw assets (Phase 1 task B1b). Metro
// treats `.json` as source and compiles it into the Hermes bytecode; an asset is
// copied next to the bundle instead, and the app reads it at runtime
// (src/utils/airportAsset.ts). The airport table, 648 KB, is the only one.
config.resolver.assetExts.push('jsonasset');

module.exports = config;
