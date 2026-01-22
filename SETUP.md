# Developer Setup Guide

## Overview

This Android app visualizes moon phases by showing the relative positions of the Sun, Earth, and Moon, along with light ray trajectories.

## Project Structure

```
moon-phases/
├── app/
│   ├── build.gradle.kts              # App-level Gradle configuration
│   └── src/main/
│       ├── AndroidManifest.xml       # App manifest
│       ├── java/com/moonphases/
│       │   ├── MainActivity.kt       # Main activity with slider
│       │   └── MoonPhaseView.kt      # Custom view for visualization
│       └── res/
│           ├── layout/
│           │   └── activity_main.xml # Main UI layout
│           ├── values/
│           │   ├── strings.xml       # String resources
│           │   └── themes.xml        # App theme
│           └── mipmap-*/             # App icons
├── build.gradle.kts                  # Project-level Gradle configuration
├── settings.gradle.kts               # Gradle settings
├── gradle.properties                 # Gradle properties
└── tools/
    └── demo_visualization.py         # Python demo script
```

## Prerequisites

### For Android Development
1. **Android Studio**: Download from [developer.android.com](https://developer.android.com/studio)
2. **Android SDK**: Install via Android Studio SDK Manager
   - Minimum SDK: API 24 (Android 7.0)
   - Target SDK: API 34 (Android 14)
3. **JDK**: OpenJDK 11 or later

### For Demo Visualization
- Python 3.7+
- Pillow library: `pip install Pillow`

## Building the Android App

### Option 1: Android Studio (Recommended)

1. **Open Project**
   ```bash
   # Clone and open in Android Studio
   git clone https://github.com/kkaan/moon-phases.git
   ```
   Then: File → Open → Select `moon-phases` folder

2. **Sync Gradle**
   - Android Studio will prompt to sync Gradle files
   - Click "Sync Now" if needed

3. **Build**
   - Build → Make Project (Ctrl+F9 / Cmd+F9)

4. **Run**
   - Connect Android device or start emulator
   - Run → Run 'app' (Shift+F10 / Ctrl+R)

### Option 2: Command Line

```bash
# Navigate to project directory
cd moon-phases

# Build debug APK
./gradlew assembleDebug

# Install on connected device
./gradlew installDebug

# Build and run
./gradlew installDebug
adb shell am start -n com.moonphases/.MainActivity
```

## Key Components

### MainActivity.kt
- Manages the UI and user interactions
- Handles slider value changes
- Updates phase name text based on slider position
- Triggers view updates

### MoonPhaseView.kt
- Custom View that draws the visualization
- Calculates celestial body positions
- Renders:
  - Sun with glow effect
  - Earth with observer indicator
  - Moon with accurate phase rendering
  - Light rays from sun
  - Orbital path
  - Light trajectory to observer

### Layout (activity_main.xml)
- Material Design 3 slider for phase selection
- Custom MoonPhaseView for visualization
- TextView for displaying current phase name
- Dark space-themed background

## Customization

### Changing Colors
Edit `app/src/main/res/values/themes.xml`:
```xml
<color name="space_background">#0A0E27</color>
<color name="sun_yellow">#FDB813</color>
<color name="earth_blue">#4A90E2</color>
<color name="moon_gray">#C0C0C0</color>
```

### Adjusting Scale/Size
In `MoonPhaseView.kt`, modify the `scale` variable:
```kotlin
val scale = min(width, height) / 10f  // Increase divisor for smaller objects
```

### Adding More Phases
In `MainActivity.kt`, adjust the slider's `stepSize`:
```kotlin
android:stepSize="0.0625"  // Currently 16 steps (8 major phases × 2)
```

## Testing

### Manual Testing
1. Install app on device/emulator
2. Move slider left to right
3. Verify:
   - Moon moves around Earth
   - Moon phase changes correctly
   - Phase name updates
   - Light rays track properly
   - Observer faces moon

### Expected Behavior
- **New Moon (0.0)**: Moon to the right, dark
- **First Quarter (0.25)**: Moon at bottom, half lit
- **Full Moon (0.5)**: Moon to the left, fully lit
- **Last Quarter (0.75)**: Moon at top, half lit

## Troubleshooting

### Gradle Sync Failed
- Ensure Android SDK is installed
- Check internet connection for dependencies
- Try: File → Invalidate Caches / Restart

### App Crashes on Start
- Check minimum SDK version (API 24)
- Verify all resources are present
- Check Logcat for error messages

### Visualization Not Showing
- Ensure custom view is properly inflated
- Check for any drawing exceptions in Logcat
- Verify Paint objects are initialized

## Performance Optimization

The app uses efficient drawing techniques:
- `Paint.ANTI_ALIAS_FLAG` for smooth rendering
- Single `invalidate()` call per update
- Minimal calculations in `onDraw()`
- Reused Paint objects

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - See LICENSE file for details
