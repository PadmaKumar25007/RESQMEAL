// Backend / AI service base URLs.
// - Use your machine's LAN IP when testing on a physical device (e.g. http://192.168.1.100:4000/api)
// - Localhost works only for the Expo web / simulator.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:4000/api';
export const AI_BASE_URL = process.env.EXPO_PUBLIC_AI_URL || 'http://192.168.1.100:8000';
