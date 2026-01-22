# Moon Phases - Interactive Visualization

An interactive Android app that shows with beautiful visuals how the position of the sun, the moon, and the earth cause the observed phases of the moon.

## Features

- 🌙 **Interactive Slider**: Smoothly transition through all moon phases
- 🌍 **3D Visualization**: See the relative positions of Earth, Moon, and Sun
- ☀️ **Light Ray Visualization**: Understand how sunlight creates moon phases
- 👁️ **Observer Perspective**: Red dot shows the observer's position on Earth
- 🎨 **Beautiful Design**: Space-themed dark UI with accurate celestial body colors

## Moon Phases Covered

1. **New Moon** - Moon between Earth and Sun
2. **Waxing Crescent** - Small sliver of light visible
3. **First Quarter** - Right half illuminated
4. **Waxing Gibbous** - More than half illuminated
5. **Full Moon** - Fully illuminated face visible from Earth
6. **Waning Gibbous** - Decreasing from full
7. **Last Quarter** - Left half illuminated  
8. **Waning Crescent** - Small sliver before new moon

## How It Works

The app demonstrates that moon phases are caused by:
- The moon's orbital position relative to Earth and Sun
- The angle at which sunlight reflects off the moon's surface
- The observer's perspective from Earth

The visualization shows:
- **Sun** (yellow/orange): Light source on the left
- **Earth** (blue): Center of the view with observer
- **Moon** (gray): Orbits around Earth, showing current phase
- **Light rays**: Indicate the path of sunlight
- **Orbit path**: White circle showing moon's orbital path

## Building the App

### Requirements
- Android Studio Arctic Fox or later
- Android SDK API 24 or higher
- Kotlin 1.9.20

### Build Instructions

```bash
# Clone the repository
git clone https://github.com/kkaan/moon-phases.git
cd moon-phases

# Build with Gradle
./gradlew build

# Install on device/emulator
./gradlew installDebug
```

## Technical Implementation

### Architecture
- **MainActivity.kt**: Main activity managing UI and slider interactions
- **MoonPhaseView.kt**: Custom view rendering the celestial visualization
- **activity_main.xml**: Layout with slider and custom view

### Key Features
- Custom Canvas drawing for smooth animations
- Real-time phase calculations based on orbital geometry
- Material Design 3 components
- Dark theme optimized for astronomy content

## Demo Visualizations

A Python demo script (`demo_visualization.py`) is included to generate static previews of different moon phases, demonstrating what the interactive app displays.

## License

MIT License - See LICENSE file for details
