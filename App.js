import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  PanResponder,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CENTER_X = SCREEN_WIDTH / 2;
const CENTER_Y = SCREEN_HEIGHT * 0.38;

// Orbit & body sizes
const ORBIT_RADIUS = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.28;
const EARTH_RADIUS = 28;
const MOON_RADIUS = 14;
const SUN_VISUAL_RADIUS = 22;

// Moon phase names keyed to angle ranges
const PHASE_NAMES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
];

function getPhaseName(angleDeg) {
  // Normalize to 0-360
  const a = ((angleDeg % 360) + 360) % 360;
  const idx = Math.floor(((a + 22.5) % 360) / 45);
  return PHASE_NAMES[idx];
}

// Build an SVG path for the lit portion of the moon as seen from Earth
function moonPhasePath(angleDeg, r) {
  // angleDeg: 0 = new moon (moon between sun & earth)
  // 180 = full moon (earth between sun & moon)
  const a = ((angleDeg % 360) + 360) % 360;
  const phase = a / 360; // 0..1

  // Illumination fraction: 0 at new, 1 at full
  const illum = (1 - Math.cos((phase * 2 * Math.PI))) / 2;

  // The terminator is drawn as an elliptical arc.
  // kx controls how squished the ellipse is: ranges from -r (new) to +r (full)
  const kx = (2 * illum - 1) * r;

  // Right half is lit when phase < 0.5 (waxing), left when phase >= 0.5 (waning)
  if (phase < 0.5) {
    // Right side lit
    // Right semicircle (always drawn) + terminator arc
    return `
      M 0 ${-r}
      A ${r} ${r} 0 0 1 0 ${r}
      A ${Math.abs(kx)} ${r} 0 0 ${kx >= 0 ? 1 : 0} 0 ${-r}
      Z
    `;
  } else {
    // Left side lit
    return `
      M 0 ${-r}
      A ${r} ${r} 0 0 0 0 ${r}
      A ${Math.abs(kx)} ${r} 0 0 ${kx >= 0 ? 0 : 1} 0 ${-r}
      Z
    `;
  }
}

// Small moon phase preview for the bottom strip
function PhasePreview({ angleDeg, size, label, isActive }) {
  const r = size / 2 - 2;
  return (
    <View style={[styles.previewItem, isActive && styles.previewItemActive]}>
      <Svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}>
        <Circle r={r} fill="#222" />
        <Path d={moonPhasePath(angleDeg, r)} fill="#F5F5DC" />
      </Svg>
      <Text style={[styles.previewLabel, isActive && styles.previewLabelActive]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export default function App() {
  // angle: 0 = new moon, 180 = full moon
  const [angle, setAngle] = useState(45);

  const moonX = CENTER_X + ORBIT_RADIUS * Math.sin((angle * Math.PI) / 180);
  const moonY = CENTER_Y - ORBIT_RADIUS * Math.cos((angle * Math.PI) / 180);

  // +90° offset because the sun is to the left (270° in our coordinate system)
  // so angle 0° (top) is actually First Quarter, not New Moon
  const phaseAngle = angle + 90;
  const phaseName = getPhaseName(phaseAngle);

  // Sun rays come from the left in the top-down view
  const sunX = CENTER_X - SCREEN_WIDTH * 0.42;
  const sunY = CENTER_Y;

  // PanResponder for dragging the moon
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const dx = gesture.moveX - CENTER_X;
        const dy = gesture.moveY - CENTER_Y;
        let newAngle = (Math.atan2(dx, -dy) * 180) / Math.PI;
        newAngle = ((newAngle % 360) + 360) % 360;
        setAngle(newAngle);
      },
    })
  ).current;

  // Explanation text based on current phase
  const explanations = {
    'New Moon': "The Moon is between the Sun and Earth.\nThe lit side faces away from us.",
    'Waxing Crescent': "A sliver of light appears on the right.\nThe Moon moves away from the Sun's direction.",
    'First Quarter': "Half the Moon is illuminated.\nThe Moon is 90° from the Sun.",
    'Waxing Gibbous': "Most of the Moon is lit.\nIt's approaching its full position.",
    'Full Moon': "The Earth is between the Sun and Moon.\nThe entire face we see is illuminated.",
    'Waning Gibbous': "Light begins to shrink from the right.\nThe Moon moves past full phase.",
    'Last Quarter': "The left half is illuminated.\nThe Moon is 270° from the Sun.",
    'Waning Crescent': "A thin sliver remains on the left.\nThe Moon returns toward New Moon.",
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar style="light" />

      <Text style={styles.title}>Moon Phases</Text>
      <Text style={styles.subtitle}>Drag to orbit the Moon around Earth</Text>

      {/* Top-down orbital diagram */}
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT * 0.55}>
        <Defs>
          <RadialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFF59D" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#FFF59D" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="earthGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#4FC3F7" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#4FC3F7" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Background stars */}
        {Array.from({ length: 50 }).map((_, i) => (
          <Circle
            key={i}
            cx={(((i * 137.508) % SCREEN_WIDTH))}
            cy={(((i * 97.31 + 23) % (SCREEN_HEIGHT * 0.55)))}
            r={Math.random() > 0.7 ? 1.5 : 0.8}
            fill="#ffffff"
            opacity={0.3 + (i % 5) * 0.12}
          />
        ))}

        {/* Sunlight arrows */}
        {[-100, -50, 0, 50, 100].map((offset) => (
          <React.Fragment key={offset}>
            <Path
              d={`M ${sunX + 40} ${sunY + offset} L ${CENTER_X - ORBIT_RADIUS - 30} ${sunY + offset}`}
              stroke="#FFF59D"
              strokeWidth={1}
              opacity={0.25}
              strokeDasharray="6,4"
            />
          </React.Fragment>
        ))}

        {/* Sun glow */}
        <Circle cx={sunX} cy={sunY} r={50} fill="url(#sunGlow)" />
        {/* Sun */}
        <Circle cx={sunX} cy={sunY} r={SUN_VISUAL_RADIUS} fill="#FFD54F" />
        <Text
          x={sunX}
          y={sunY + SUN_VISUAL_RADIUS + 16}
          fill="#FFD54F"
          fontSize={11}
          textAnchor="middle"
          fontWeight="bold"
        >
          Sun
        </Text>

        {/* Moon orbit path */}
        <Circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={ORBIT_RADIUS}
          fill="none"
          stroke="#555"
          strokeWidth={1}
          strokeDasharray="4,6"
        />

        {/* Earth glow */}
        <Circle cx={CENTER_X} cy={CENTER_Y} r={50} fill="url(#earthGlow)" />
        {/* Earth */}
        <Circle cx={CENTER_X} cy={CENTER_Y} r={EARTH_RADIUS} fill="#4FC3F7" />
        <Circle cx={CENTER_X - 6} cy={CENTER_Y - 5} r={8} fill="#66BB6A" opacity={0.7} />
        <Circle cx={CENTER_X + 8} cy={CENTER_Y + 6} r={6} fill="#66BB6A" opacity={0.6} />

        {/* Shadow on Earth (right side, away from sun) */}
        <Path
          d={`
            M ${CENTER_X} ${CENTER_Y - EARTH_RADIUS}
            A ${EARTH_RADIUS} ${EARTH_RADIUS} 0 0 1 ${CENTER_X} ${CENTER_Y + EARTH_RADIUS}
            A ${EARTH_RADIUS * 0.3} ${EARTH_RADIUS} 0 0 0 ${CENTER_X} ${CENTER_Y - EARTH_RADIUS}
            Z
          `}
          fill="rgba(0,0,0,0.45)"
        />

        {/* Moon — top-down view: left half lit (facing sun) */}
        <Circle cx={moonX} cy={moonY} r={MOON_RADIUS} fill="#333" />
        {/* Lit half faces sun (left side) */}
        <Path
          d={`
            M ${moonX} ${moonY - MOON_RADIUS}
            A ${MOON_RADIUS} ${MOON_RADIUS} 0 0 0 ${moonX} ${moonY + MOON_RADIUS}
            A ${MOON_RADIUS * 0.1} ${MOON_RADIUS} 0 0 1 ${moonX} ${moonY - MOON_RADIUS}
            Z
          `}
          fill="#E0E0E0"
        />

        {/* Moon label */}
        <Text
          fill="#ccc"
          fontSize={11}
          textAnchor="middle"
          fontWeight="bold"
        >
          Moon
        </Text>

        {/* Drag indicator circle */}
        <Circle
          cx={moonX}
          cy={moonY}
          r={MOON_RADIUS + 8}
          fill="none"
          stroke="#fff"
          strokeWidth={1}
          opacity={0.3}
          strokeDasharray="3,3"
        />

        {/* "Top-down view" label */}
        <Text
          x={SCREEN_WIDTH - 10}
          y={20}
          fill="#888"
          fontSize={10}
          textAnchor="end"
        >
          Top-down view (not to scale)
        </Text>
      </Svg>

      {/* Phase name & explanation */}
      <View style={styles.infoBox}>
        <Text style={styles.phaseName}>{phaseName}</Text>
        <Text style={styles.explanation}>{explanations[phaseName]}</Text>
      </View>

      {/* Moon as seen from Earth */}
      <View style={styles.earthViewContainer}>
        <Text style={styles.earthViewLabel}>View from Earth</Text>
        <View style={styles.earthViewMoon}>
          <Svg width={80} height={80} viewBox="-40 -40 80 80">
            <Circle r={30} fill="#222" />
            <Path d={moonPhasePath(phaseAngle, 30)} fill="#F5F5DC" />
          </Svg>
        </View>
      </View>

      {/* Phase strip at bottom */}
      <View style={styles.phaseStrip}>
        {PHASE_NAMES.map((name, i) => (
          <PhasePreview
            key={name}
            angleDeg={i * 45}
            size={32}
            label={name.split(' ').pop()}
            isActive={phaseName === name}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    paddingTop: 50,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  infoBox: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 2,
  },
  phaseName: {
    color: '#F5F5DC',
    fontSize: 20,
    fontWeight: 'bold',
  },
  explanation: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 19,
  },
  earthViewContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  earthViewLabel: {
    color: '#888',
    fontSize: 11,
    marginBottom: 4,
  },
  earthViewMoon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginTop: 'auto',
    marginBottom: 20,
  },
  previewItem: {
    alignItems: 'center',
    opacity: 0.5,
  },
  previewItemActive: {
    opacity: 1,
  },
  previewLabel: {
    color: '#888',
    fontSize: 8,
    marginTop: 3,
    textAlign: 'center',
    width: 40,
  },
  previewLabelActive: {
    color: '#F5F5DC',
    fontWeight: 'bold',
  },
});
