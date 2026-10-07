/**
 * Appium Capabilities and Configuration for Capacitor Android
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();

const capabilities = {
  platformName: process.env.MOBILE_PLATFORM_NAME || 'Android',
  'appium:automationName': process.env.MOBILE_AUTOMATION_NAME || 'UiAutomator2',
  'appium:deviceName': process.env.ANDROID_DEVICE || process.env.ANDROID_DEVICE_NAME || 'Android_Emulator',
  'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION || '13.0',
  'appium:appPackage': process.env.MOBILE_PACKAGE_ID || 'com.tablepulse.app',
  'appium:appActivity': process.env.MOBILE_ACTIVITY || 'com.tablepulse.app.MainActivity',
  'appium:app': process.env.APP_PATH || process.env.ANDROID_APP_PATH || '',
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
