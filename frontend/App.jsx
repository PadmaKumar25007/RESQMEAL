import RootNavigator from './src/navigation/RootNavigator.jsx';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Thin Expo entry point; routing and screen composition live under src.
export default function App(){ return <SafeAreaProvider><RootNavigator/></SafeAreaProvider>; }
