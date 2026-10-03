const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

module.exports = withNativeWind(config, { input: "./global.css" });
