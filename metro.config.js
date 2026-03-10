const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Le decimos a Metro que acepte los archivos .wasm como recursos (assets)
config.resolver.assetExts.push('wasm');

module.exports = config;