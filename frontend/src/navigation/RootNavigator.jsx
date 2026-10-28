import React,{useState,useEffect} from 'react';
import { View,Text,Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getToken } from '../services/api.js';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen.jsx';
import AuthScreen from '../screens/auth/AuthScreen.jsx';
import AIFeaturesScreen from '../screens/ai/AIFeaturesScreen.jsx';
import DonorScreen from '../screens/donor/DonorScreen.jsx';
import NGOScreen from '../screens/ngo/NGOScreen.jsx';
import VolunteerScreen from '../screens/volunteer/VolunteerScreen.jsx';
import AdminScreen from '../screens/admin/AdminScreen.jsx';
import { styles,colors } from '../theme.jsx';
export default function RootNavigator(){
  const [view,setView]=useState('welcome');
  const [role,setRole]=useState(null);
  const [screen,setScreenState]=useState('home');
  const [user,setUser]=useState(null);
  const [booting,setBooting]=useState(true);

  useEffect(()=>{
    let mounted = true;
    const restore = async () => {
      try {
        const token = await getToken();
        if (token) {
          const { api } = await import('../services/api.js');
          const res = await api.me();
          if (mounted && res?.data) {
            setUser(res.data);
            setRole(res.data.role);
            setScreenState('home');
            setView('app');
          }
        }
      } catch (_e) {
        // token invalid/expired -> stay logged out
      } finally {
        if (mounted) setBooting(false);
      }
    };
    restore();
    return () => { mounted = false; };
  },[]);

  const setScreen=(next)=>next==='roles'?setView('roles'):setScreenState(next);

  const handleAuth=(u)=>{ setUser(u); setRole(u.role); setScreenState('home'); setView('app'); };
  const handleLogout=()=>{ setUser(null); setRole(null); setScreenState('home'); setView('roles'); };

  if(booting)return <SafeAreaView edges={['top']} style={styles.safe}/>;
  if(view==='welcome')return <SafeAreaView edges={['top']} style={[styles.safe,{justifyContent:'center',padding:28,backgroundColor:'#F3FBF6'}]}><View style={{width:82,height:82,borderRadius:27,backgroundColor:colors.green,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:42}}>🍃</Text></View><Text style={[styles.title,{fontSize:42,marginTop:23}]}>ResQMeal</Text><Text style={{fontSize:19,color:colors.green,fontWeight:'700',marginTop:5}}>Saving Food. Feeding Lives.</Text><Text style={[styles.meta,{fontSize:16,lineHeight:24,marginTop:22,marginBottom:25}]}>A simple way to move good food from places of surplus to people who need it.</Text><Pressable style={styles.button} onPress={()=>setView('auth')}><Text style={styles.buttonText}>Get Started  →</Text></Pressable></SafeAreaView>;
  if(view==='auth')return <AuthScreen onAuth={handleAuth} onBack={()=>setView('welcome')}/>;
  if(view==='ai')return <SafeAreaView edges={['top']} style={styles.safe}><AIFeaturesScreen onBack={()=>setView('roles')}/></SafeAreaView>;
  if(view==='roles')return <RoleSelectionScreen onSelect={(r)=>{setRole(r);setScreen('home');setView('app')}} onAI={()=>setView('ai')}/>;
  const Screen={donor:DonorScreen,ngo:NGOScreen,volunteer:VolunteerScreen,admin:AdminScreen}[role];
  return <Screen screen={screen} setScreen={setScreen} user={user} setUser={setUser} onLogout={handleLogout}/>;
}
