import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path, Defs, RadialGradient, Stop, Rect, Line, G } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CENTER_X = SCREEN_WIDTH / 2;
const CENTER_Y = SCREEN_HEIGHT * 0.38;

// Orbit & body sizes
const ORBIT_RADIUS = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.28;
const EARTH_RADIUS = 28;
const MOON_RADIUS = 14;
const SUN_VISUAL_RADIUS = 22;

// Side view constants
const INCLINATION_DEG = 5.14;
const INCLINATION_RAD = (INCLINATION_DEG * Math.PI) / 180;
const SIDE_VIEW_EXAGGERATION = 6;
const NODE_LONGITUDE = 80; // ascending node at this orbital angle (degrees)

// Eclipse detection thresholds
const ECLIPSE_NODE_TOLERANCE_DEG = 15;
const ECLIPSE_PHASE_TOLERANCE_DEG = 18;

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

// Detect if current angle produces an eclipse condition
function detectEclipse(angle) {
  const phaseAngle = (((angle + 90) % 360) + 360) % 360;
  const elevationAngle = (((angle - NODE_LONGITUDE) % 360) + 360) % 360;

  // Distance from nearest node (0° or 180° of elevationAngle)
  const distFromAscNode = Math.min(elevationAngle, 360 - elevationAngle);
  const distFromDescNode = Math.abs(elevationAngle - 180);
  const distFromNearestNode = Math.min(distFromAscNode, distFromDescNode);

  // Distance from New Moon (phaseAngle near 0/360)
  const distFromNewMoon = Math.min(phaseAngle, 360 - phaseAngle);
  // Distance from Full Moon (phaseAngle near 180)
  const distFromFullMoon = Math.abs(phaseAngle - 180);

  const nearNode = distFromNearestNode < ECLIPSE_NODE_TOLERANCE_DEG;

  if (nearNode && distFromNewMoon < ECLIPSE_PHASE_TOLERANCE_DEG) return 'solar';
  if (nearNode && distFromFullMoon < ECLIPSE_PHASE_TOLERANCE_DEG) return 'lunar';
  return null;
}

// Generate SVG path for the Moon's tilted orbit in side view
function generateTiltedOrbitPath(cx, cy, radius) {
  const semiMinor = radius * Math.sin(INCLINATION_RAD) * SIDE_VIEW_EXAGGERATION;
  const points = [];
  for (let deg = 0; deg <= 360; deg += 5) {
    const rad = (deg * Math.PI) / 180;
    const elevRad = ((deg - NODE_LONGITUDE) * Math.PI) / 180;
    const x = cx + radius * Math.sin(rad);
    const y = cy - semiMinor * Math.sin(elevRad);
    points.push(`${deg === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  points.push('Z');
  return points.join(' ');
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
  const [viewMode, setViewMode] = useState('top'); // 'top' | 'side'

  const angleRad = (angle * Math.PI) / 180;
  const moonX = CENTER_X + ORBIT_RADIUS * Math.sin(angleRad);
  const moonY = CENTER_Y - ORBIT_RADIUS * Math.cos(angleRad);

  // Side view derived values
  const elevationAngleRad = ((angle - NODE_LONGITUDE) * Math.PI) / 180;
  const sideOrbitSemiMinor = ORBIT_RADIUS * Math.sin(INCLINATION_RAD) * SIDE_VIEW_EXAGGERATION;
  const sideMoonX = CENTER_X + ORBIT_RADIUS * Math.sin(angleRad);
  const sideElevation = sideOrbitSemiMinor * Math.sin(elevationAngleRad);
  const sideMoonY = CENTER_Y - sideElevation;

  // Eclipse detection
  const eclipseType = detectEclipse(angle);

  // Node positions in side view
  const ascNodeX = CENTER_X + ORBIT_RADIUS * Math.sin((NODE_LONGITUDE * Math.PI) / 180);
  const descNodeX = CENTER_X + ORBIT_RADIUS * Math.sin(((NODE_LONGITUDE + 180) * Math.PI) / 180);

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

  let currentExplanation = explanations[phaseName];
  if (eclipseType === 'solar') {
    currentExplanation = "The Moon is near the ecliptic plane and\nbetween the Sun and Earth — a solar eclipse!";
  } else if (eclipseType === 'lunar') {
    currentExplanation = "The Moon is near the ecliptic plane and\nbehind the Earth — a lunar eclipse!";
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.title}>Moon Phases</Text>
      <Text style={styles.subtitle}>Drag to orbit the Moon around Earth</Text>

      {/* View toggle */}
      <View style={styles.viewToggleContainer}>
        <TouchableOpacity
          style={[styles.viewToggleButton, viewMode === 'top' && styles.viewToggleActive]}
          onPress={() => setViewMode('top')}
        >
          <Text style={[styles.viewToggleText, viewMode === 'top' && styles.viewToggleTextActive]}>
            Top View
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewToggleButton, viewMode === 'side' && styles.viewToggleActive]}
          onPress={() => setViewMode('side')}
        >
          <Text style={[styles.viewToggleText, viewMode === 'side' && styles.viewToggleTextActive]}>
            Side View
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orbital diagram */}
      <View {...panResponder.panHandlers}>
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
            r={((i * 73) % 10) > 7 ? 1.5 : 0.8}
            fill="#ffffff"
            opacity={0.3 + (i % 5) * 0.12}
          />
        ))}

        {viewMode === 'top' ? (
          <G>
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
          </G>
        ) : (
          <G>
            {/* ===== SIDE VIEW ===== */}

            {/* Ecliptic plane line */}
            <Line
              x1={20} y1={CENTER_Y}
              x2={SCREEN_WIDTH - 20} y2={CENTER_Y}
              stroke="#FFD54F"
              strokeWidth={1}
              opacity={0.25}
              strokeDasharray="8,4"
            />
            <Text
              x={SCREEN_WIDTH - 10}
              y={CENTER_Y - 10}
              fill="#FFD54F"
              fontSize={9}
              textAnchor="end"
              opacity={0.5}
            >
              Ecliptic plane
            </Text>

            {/* Sunlight arrows (along ecliptic) */}
            {[-40, 0, 40].map((offset) => (
              <Path
                key={offset}
                d={`M ${sunX + 40} ${CENTER_Y + offset} L ${CENTER_X - ORBIT_RADIUS - 30} ${CENTER_Y + offset}`}
                stroke="#FFF59D"
                strokeWidth={1}
                opacity={0.2}
                strokeDasharray="6,4"
              />
            ))}

            {/* Sun (on ecliptic, far left) */}
            <Circle cx={sunX} cy={CENTER_Y} r={50} fill="url(#sunGlow)" />
            <Circle cx={sunX} cy={CENTER_Y} r={SUN_VISUAL_RADIUS} fill="#FFD54F" />
            <Text
              x={sunX}
              y={CENTER_Y + SUN_VISUAL_RADIUS + 16}
              fill="#FFD54F"
              fontSize={11}
              textAnchor="middle"
              fontWeight="bold"
            >
              Sun
            </Text>

            {/* Earth's shadow cone (extends rightward along ecliptic) */}
            <Path
              d={`
                M ${CENTER_X + EARTH_RADIUS} ${CENTER_Y - 2}
                L ${CENTER_X + ORBIT_RADIUS + 30} ${CENTER_Y - 8}
                L ${CENTER_X + ORBIT_RADIUS + 30} ${CENTER_Y + 8}
                L ${CENTER_X + EARTH_RADIUS} ${CENTER_Y + 2}
                Z
              `}
              fill="rgba(0,0,0,0.2)"
              stroke="#555"
              strokeWidth={0.5}
              opacity={0.5}
            />
            <Text
              x={CENTER_X + ORBIT_RADIUS + 34}
              y={CENTER_Y + 4}
              fill="#666"
              fontSize={8}
              textAnchor="start"
            >
              Shadow
            </Text>

            {/* Moon's tilted orbital path */}
            <Path
              d={generateTiltedOrbitPath(CENTER_X, CENTER_Y, ORBIT_RADIUS)}
              fill="none"
              stroke="#555"
              strokeWidth={1}
              strokeDasharray="4,6"
            />

            {/* Node markers (where orbit crosses ecliptic) */}
            <Circle cx={ascNodeX} cy={CENTER_Y} r={4} fill="none" stroke="#FF8A65" strokeWidth={1.5} />
            <Text
              x={ascNodeX}
              y={CENTER_Y + 16}
              fill="#FF8A65"
              fontSize={9}
              textAnchor="middle"
            >
              Asc. Node
            </Text>
            <Circle cx={descNodeX} cy={CENTER_Y} r={4} fill="none" stroke="#FF8A65" strokeWidth={1.5} />
            <Text
              x={descNodeX}
              y={CENTER_Y + 16}
              fill="#FF8A65"
              fontSize={9}
              textAnchor="middle"
            >
              Desc. Node
            </Text>

            {/* Earth (center, on ecliptic) */}
            <Circle cx={CENTER_X} cy={CENTER_Y} r={50} fill="url(#earthGlow)" />
            <Circle cx={CENTER_X} cy={CENTER_Y} r={EARTH_RADIUS} fill="#4FC3F7" />
            <Circle cx={CENTER_X - 6} cy={CENTER_Y - 5} r={8} fill="#66BB6A" opacity={0.7} />
            <Circle cx={CENTER_X + 8} cy={CENTER_Y + 6} r={6} fill="#66BB6A" opacity={0.6} />
            <Path
              d={`
                M ${CENTER_X} ${CENTER_Y - EARTH_RADIUS}
                A ${EARTH_RADIUS} ${EARTH_RADIUS} 0 0 1 ${CENTER_X} ${CENTER_Y + EARTH_RADIUS}
                A ${EARTH_RADIUS * 0.3} ${EARTH_RADIUS} 0 0 0 ${CENTER_X} ${CENTER_Y - EARTH_RADIUS}
                Z
              `}
              fill="rgba(0,0,0,0.45)"
            />

            {/* Vertical guide line from Moon to ecliptic */}
            {Math.abs(sideElevation) > 5 && (
              <Line
                x1={sideMoonX} y1={sideMoonY + (sideElevation > 0 ? MOON_RADIUS : -MOON_RADIUS)}
                x2={sideMoonX} y2={CENTER_Y}
                stroke="#aaa"
                strokeWidth={0.5}
                strokeDasharray="2,3"
                opacity={0.4}
              />
            )}

            {/* Moon */}
            <Circle cx={sideMoonX} cy={sideMoonY} r={MOON_RADIUS} fill="#333" />
            <Path
              d={`
                M ${sideMoonX} ${sideMoonY - MOON_RADIUS}
                A ${MOON_RADIUS} ${MOON_RADIUS} 0 0 0 ${sideMoonX} ${sideMoonY + MOON_RADIUS}
                A ${MOON_RADIUS * 0.1} ${MOON_RADIUS} 0 0 1 ${sideMoonX} ${sideMoonY - MOON_RADIUS}
                Z
              `}
              fill="#E0E0E0"
            />

            {/* Drag indicator */}
            <Circle
              cx={sideMoonX}
              cy={sideMoonY}
              r={MOON_RADIUS + 8}
              fill="none"
              stroke="#fff"
              strokeWidth={1}
              opacity={0.3}
              strokeDasharray="3,3"
            />

            {/* Eclipse indicators */}
            {eclipseType === 'solar' && (
              <G>
                <Circle cx={sideMoonX} cy={sideMoonY} r={MOON_RADIUS + 14} fill="none" stroke="#FF5252" strokeWidth={2} opacity={0.8} />
                <Text
                  x={sideMoonX}
                  y={sideMoonY - MOON_RADIUS - 22}
                  fill="#FF5252"
                  fontSize={11}
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  Solar Eclipse!
                </Text>
              </G>
            )}
            {eclipseType === 'lunar' && (
              <G>
                <Circle cx={sideMoonX} cy={sideMoonY} r={MOON_RADIUS + 14} fill="none" stroke="#CE93D8" strokeWidth={2} opacity={0.8} />
                <Text
                  x={sideMoonX}
                  y={sideMoonY - MOON_RADIUS - 22}
                  fill="#CE93D8"
                  fontSize={11}
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  Lunar Eclipse!
                </Text>
              </G>
            )}

            {/* Side view label */}
            <Text
              x={SCREEN_WIDTH - 10}
              y={20}
              fill="#888"
              fontSize={10}
              textAnchor="end"
            >
              Side view — ~5° tilt (exaggerated)
            </Text>
          </G>
        )}
      </Svg>
      </View>

      {/* Phase name & explanation */}
      <View style={styles.infoBox}>
        <Text style={styles.phaseName}>
          {phaseName}
        </Text>
        {eclipseType && (
          <Text style={styles.eclipseLabel}>
            {eclipseType === 'solar' ? 'Solar Eclipse' : 'Lunar Eclipse'}
          </Text>
        )}
        <Text style={styles.explanation}>{currentExplanation}</Text>
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
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4,
    gap: 8,
  },
  viewToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  viewToggleActive: {
    backgroundColor: '#1a2040',
    borderColor: '#4FC3F7',
  },
  viewToggleText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  viewToggleTextActive: {
    color: '#4FC3F7',
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
  eclipseLabel: {
    color: '#FF5252',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
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
