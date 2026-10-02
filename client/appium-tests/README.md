# TablePulse AI — Mobile Appium Automation Suite

## Overview
This directory contains the professional mobile test automation framework for TablePulse AI's Android mobile application (built using Capacitor). It uses Appium with the `UiAutomator2` automation engine and follows the Screen Object Model (SOM) architecture.

---

## Prerequisites & System Requirements
1. **Node.js**: v18+ (tested on current Node.js runtime)
2. **Android SDK & Build Tools**:
   - `ANDROID_HOME` or `ANDROID_SDK_ROOT` environment variable pointing to Android SDK directory.
   - `platform-tools` (with `adb.exe`) added to system `PATH`.
3. **Appium Server**:
   - Install Appium globally or run local instance:
     ```bash
     npm install -g appium
     appium driver install uiautomator2
     appium
     ```
4. **Android Device or Emulator**:
   - Connected physical Android device with **USB Debugging** enabled, OR
   - Android Virtual Device (AVD) running via Android Studio emulator:
     ```bash
     emulator -avd Pixel_6_API_33
     ```
5. **Application Binary**:
   - Built Capacitor Android debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Environment Configuration
Configure settings via environment variables or a `.env` file in `client/appium-tests/`:

| Variable | Description | Default Value |
|---|---|---|
| `ANDROID_DEVICE_NAME` | Name of ADB emulator or device | `Android_Emulator` |
| `ANDROID_PLATFORM_VERSION` | Android OS version | `13.0` |
| `APPIUM_SERVER_URL` | URL of running Appium server | `http://127.0.0.1:4723/` |
| `ANDROID_APP_PATH` | Absolute or relative path to app APK | `../../android/app/build/outputs/apk/debug/app-debug.apk` |
| `MOBILE_PACKAGE_ID` | Application Android package ID | `com.tablepulse.app` |
| `MOBILE_ACTIVITY` | Android Launch Activity | `com.tablepulse.app.MainActivity` |

---

## Directory Structure
```
client/appium-tests/
├── config/
│   └── capabilities.js         # UiAutomator2 desired capabilities
├── screens/
│   ├── BaseScreen.js           # Base screen with reusable interaction methods
│   └── index.js                # Screen objects (Login, Home, Restaurant, Tables, etc.)
├── tests/
│   └── run-mobile-tests.js     # Master test runner (325 test cases: MOB-E2E-001 to 325)
├── utils/
│   ├── deviceDetector.js       # ADB connected device detection
│   └── reportGenerator.js      # Excel report generator
├── reports/                    # Generated test execution logs & reports
├── screenshots/                # Failure screenshots
└── package.json                # Test runner scripts and dependencies
```

---

## Execution Commands

### 1. Detect ADB Devices
```bash
adb devices
```

### 2. Run Test Suite
```bash
npm run test
# OR from project root:
npm run test:mobile
```

### 3. Generate Excel Report
```bash
npm run report
```

The generated report will be saved to:
`reports/appium/TablePulse_Mobile_Appium_Test_Report.xlsx`

---

## Execution Policy (Real College Project Compliance)
- When a physical device or emulator is connected via ADB, the suite attaches and executes interactions against the native WebView.
- When **no ADB device or emulator is connected**, the framework detects this state automatically and records all test cases as **`BLOCKED`** with the explicit reason:
  `"BLOCKED: No Android device or emulator connected via ADB. Run 'adb devices' and launch an emulator or connect a device with USB debugging enabled to execute Appium mobile test."`
- In accordance with rigorous QA principles, **unexecuted tests are never marked as PASSED**.
