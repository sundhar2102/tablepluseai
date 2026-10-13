/**
 * Appium Capabilities and Configuration for Capacitor Android
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();

const fs = require('fs');

const defaultApkPath = path.resolve(__dirname, '../../../smart-table-ai.apk');
const resolvedAppPath = process.env.APP_PATH || process.env.ANDROID_APP_PATH || (fs.existsSync(defaultApkPath) ? defaultApkPath : '');

const capabilities = {
  platformName: process.env.MOBILE_PLATFORM_NAME || 'Android',
  'appium:automationName': process.env.MOBILE_AUTOMATION_NAME || 'UiAutomator2',
  'appium:deviceName': process.env.ANDROID_DEVICE || process.env.ANDROID_DEVICE_NAME || 'Android_Emulator',
  ...(process.env.ANDROID_PLATFORM_VERSION ? { 'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION } : {}),
  'appium:appPackage': process.env.MOBILE_PACKAGE_ID || 'com.tablepulse.app',
  'appium:appActivity': process.env.MOBILE_ACTIVITY || 'com.tablepulse.app.MainActivity',
  ...(resolvedAppPath ? { 'appium:app': resolvedAppPath } : {}),
  'appium:noReset': false,
  'appium:fullReset': false,
  'appium:newCommandTimeout': 240,
  'appium:autoGrantPermissions': true
};

const serverConfig = {
  protocol: 'http',
  hostname: process.env.APPIUM_SERVER || process.env.APPIUM_HOST || '127.0.0.1',
  port: parseInt(process.env.APPIUM_PORT || '4723', 10),
  path: '/'
};

module.exports = {
  capabilities,
  serverConfig,
  reportsDir: path.resolve(__dirname, '../reports'),
  screenshotsDir: path.resolve(__dirname, '../screenshots')
};
