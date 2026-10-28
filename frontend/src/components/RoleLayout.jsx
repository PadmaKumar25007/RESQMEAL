import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Tabs } from './UI.jsx';
import { styles } from '../theme.jsx';
export default function RoleLayout({role,screen,setScreen,title,sub,children}){return <SafeAreaView edges={['top']} style={styles.safe}><Header title={title} sub={sub} back={screen!=='home'} setScreen={setScreen}/><ScrollView contentContainerStyle={styles.content}>{children}</ScrollView><Tabs role={role} screen={screen} setScreen={setScreen}/></SafeAreaView>}
