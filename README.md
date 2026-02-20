# Moon Phases

An interactive simulation showing why and how the phases of the moon arise.

## How it works

- **Top-down orbital view**: See the Sun, Earth, and Moon from above. The sunlight direction is shown with dashed rays.
- **Drag to interact**: Drag anywhere on screen to orbit the Moon around the Earth and watch the phase change in real time.
- **View from Earth**: A separate preview shows exactly what the Moon looks like from Earth's surface at the current orbital position.
- **Phase strip**: All 8 major phases are shown at the bottom, with the current one highlighted.

## Running on your phone

```bash
npm install
npx expo start
```

Then scan the QR code with:
- **Android**: Expo Go app
- **iOS**: Camera app (opens in Expo Go)

## Building for distribution

```bash
npx expo install expo-dev-client
npx eas build --platform android  # or ios
```

## Tech stack

- [Expo](https://expo.dev) (React Native)
- [react-native-svg](https://github.com/software-mansion/react-native-svg) for rendering
