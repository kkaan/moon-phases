# Moon Phase Visualization Tool

This Python script generates static visualizations of different moon phases to demonstrate what the Android app will show interactively.

## Requirements

```bash
pip install Pillow
```

## Usage

```bash
python3 demo_visualization.py
```

This will generate 8 PNG images showing different moon phases in `/tmp/`:
- new_moon.png
- waxing_crescent.png
- first_quarter.png
- waxing_gibbous.png
- full_moon.png
- waning_gibbous.png
- last_quarter.png
- waning_crescent.png

## What It Shows

Each visualization demonstrates:
- **Sun** (left, yellow): The light source
- **Earth** (center, blue): With an observer (red dot) positioned facing the moon
- **Moon** (orbiting, gray): Showing the appropriate phase
- **Light rays**: Yellow lines showing sunlight traveling from sun to moon
- **Observer light**: Line from moon to observer showing reflected light
- **Orbit path**: White circle showing the moon's orbital path

## How Phases Work

The visualization clearly shows that moon phases depend on the moon's orbital position:
- **New Moon (0°)**: Moon between Earth and Sun - dark side faces Earth
- **First Quarter (90°)**: Moon at right angle - right half illuminated
- **Full Moon (180°)**: Moon opposite Sun - fully illuminated
- **Last Quarter (270°)**: Moon at left angle - left half illuminated

The crescent and gibbous phases occur between these primary phases.
