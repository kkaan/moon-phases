#!/usr/bin/env python3
"""
Demo script to visualize moon phases concept
This demonstrates the visualization that the Android app will show
"""
from PIL import Image, ImageDraw, ImageFont
import math

# Constants
SUN_ANGLE = math.pi  # Sun is positioned on the left (at angle π)

def draw_moon_phase_visualization(phase, output_file):
    """
    Draw a visualization of sun, earth, moon positions for a given phase
    phase: 0.0 (new moon) to 1.0 (full cycle back to new moon)
    """
    width, height = 800, 600
    img = Image.new('RGB', (width, height), (10, 14, 39))
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = width // 2, height // 2
    scale = 80
    
    # Draw orbit path
    orbit_radius = scale * 2.5
    draw.ellipse([center_x - orbit_radius, center_y - orbit_radius,
                  center_x + orbit_radius, center_y + orbit_radius],
                 outline=(255, 255, 255, 64), width=1)
    
    # Calculate moon position based on phase
    moon_angle = phase * 2 * math.pi
    moon_x = center_x + orbit_radius * math.cos(moon_angle)
    moon_y = center_y + orbit_radius * math.sin(moon_angle)
    
    # Draw sun on the left
    sun_x = center_x - scale * 4
    sun_y = center_y
    sun_radius = scale * 0.8
    
    # Sun glow
    draw.ellipse([sun_x - sun_radius * 1.4, sun_y - sun_radius * 1.4,
                  sun_x + sun_radius * 1.4, sun_y + sun_radius * 1.4],
                 fill=(253, 184, 19, 80))
    # Sun
    draw.ellipse([sun_x - sun_radius, sun_y - sun_radius,
                  sun_x + sun_radius, sun_y + sun_radius],
                 fill=(253, 184, 19))
    
    # Draw light rays
    num_rays = 5
    spread_angle = math.pi / 8
    sun_to_moon_angle = math.atan2(moon_y - sun_y, moon_x - sun_x)
    
    for i in range(num_rays):
        offset = (i - num_rays / 2) * spread_angle / num_rays
        ray_angle = sun_to_moon_angle + offset
        ray_length = scale * 6
        end_x = sun_x + ray_length * math.cos(ray_angle)
        end_y = sun_y + ray_length * math.sin(ray_angle)
        draw.line([(sun_x, sun_y), (end_x, end_y)], fill=(255, 249, 196, 60), width=2)
    
    # Draw earth at center
    earth_radius = scale * 0.6
    draw.ellipse([center_x - earth_radius, center_y - earth_radius,
                  center_x + earth_radius, center_y + earth_radius],
                 fill=(74, 144, 226))
    
    # Draw observer on earth
    observer_angle = moon_angle
    observer_x = center_x + earth_radius * math.cos(observer_angle)
    observer_y = center_y + earth_radius * math.sin(observer_angle)
    observer_radius = scale * 0.1
    draw.ellipse([observer_x - observer_radius, observer_y - observer_radius,
                  observer_x + observer_radius, observer_y + observer_radius],
                 fill=(255, 107, 107))
    
    # Draw light ray from moon to observer
    draw.line([(moon_x, moon_y), (observer_x, observer_y)], 
              fill=(255, 249, 196, 180), width=2)
    
    # Draw moon with phase
    moon_radius = scale * 0.4
    draw.ellipse([moon_x - moon_radius, moon_y - moon_radius,
                  moon_x + moon_radius, moon_y + moon_radius],
                 fill=(192, 192, 192))
    
    # Calculate shadow for moon phase
    lit_side_angle = SUN_ANGLE - moon_angle
    shadow_amount = math.cos(lit_side_angle)
    
    # Draw shadow on moon
    if shadow_amount < 0:
        # More than half lit
        shadow_width = abs(shadow_amount) * moon_radius
        draw.ellipse([moon_x - shadow_width, moon_y - moon_radius,
                      moon_x + shadow_width, moon_y + moon_radius],
                     fill=(80, 80, 80))
    else:
        # Less than half lit
        shadow_width = shadow_amount * moon_radius
        draw.ellipse([moon_x - shadow_width, moon_y - moon_radius,
                      moon_x + shadow_width, moon_y + moon_radius],
                     fill=(80, 80, 80))
    
    # Add labels
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
    except (FileNotFoundError, OSError):
        # Fall back to default font if DejaVu Sans is not available
        font = None
    
    # Phase name
    phase_names = [
        "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
        "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"
    ]
    phase_idx = int(phase * 8) % 8
    phase_name = phase_names[phase_idx]
    
    draw.text((20, 20), phase_name, fill=(255, 255, 255), font=font)
    draw.text((20, 50), "Sun", fill=(253, 184, 19), font=font)
    draw.text((center_x - 30, center_y + earth_radius + 30), "Earth", fill=(74, 144, 226), font=font)
    draw.text((moon_x - 25, moon_y + moon_radius + 20), "Moon", fill=(192, 192, 192), font=font)
    
    img.save(output_file)
    print(f"Generated: {output_file}")

if __name__ == "__main__":
    # Generate visualizations for different phases
    phases = {
        "new_moon": 0.0,
        "waxing_crescent": 0.125,
        "first_quarter": 0.25,
        "waxing_gibbous": 0.375,
        "full_moon": 0.5,
        "waning_gibbous": 0.625,
        "last_quarter": 0.75,
        "waning_crescent": 0.875
    }
    
    for name, phase in phases.items():
        draw_moon_phase_visualization(phase, f"/tmp/{name}.png")
    
    print("\nDemo visualizations created successfully!")
    print("These demonstrate what the Android app will show interactively.")
