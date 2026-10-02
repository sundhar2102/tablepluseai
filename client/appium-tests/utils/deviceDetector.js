/**
 * ADB Device Detector Utility
 * Safely inspects ADB to check for connected devices or emulators.
 */
const { execSync } = require('child_process');

function getConnectedDevices() {
  try {
    const stdout = execSync('adb devices', { encoding: 'utf-8', timeout: 5000 });
    const lines = stdout.split('\n');
    const devices = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('*')) {
        const [id, state] = line.split(/\s+/);
        if (id && state) {
          devices.push({ id, state });
        }
      }
    }
    return {
      available: devices.length > 0,
      devices,
      rawOutput: stdout.trim()
    };
  } catch (err) {
    return {
      available: false,
      devices: [],
      error: err.message,
      rawOutput: 'ADB execution failed or adb not found in PATH'
    };
  }
}

module.exports = {
  getConnectedDevices
};
