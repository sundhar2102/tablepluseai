/**
 * ADB Device Detector for Appium
 */
const { execSync } = require('child_process');

function getConnectedDevices() {
  try {
    const stdout = execSync('adb devices', { encoding: 'utf8', timeout: 5000 });
    const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
    const devices = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/\s+/);
      if (parts.length >= 2 && parts[1] === 'device') {
        devices.push({ id: parts[0], state: parts[1] });
      }
    }
    return devices;
  } catch {
    return [];
  }
}

module.exports = { getConnectedDevices };
