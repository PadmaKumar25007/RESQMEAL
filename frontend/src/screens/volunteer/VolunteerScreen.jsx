import React,{useState,useEffect,useCallback} from 'react';
import { View,Text } from 'react-native';
import { styles,colors } from '../../theme.jsx';
import { Button,Badge,Stat } from '../../components/UI.jsx';
import { api } from '../../services/api.js';
import RoleLayout from '../../components/RoleLayout.jsx';

export default function VolunteerScreen({screen,setScreen,user}){

  const [tasks,setTasks]=useState([]);
  const [stage,setStage]=useState('Available');
  const task=tasks[0];

  const loadTasks=useCallback(async()=>{ try{ const res=await api.deliveries({status:'Available'}); setTasks(res.data||[]);}catch(_e){setTasks([]);} },[user]);

  useEffect(()=>{ if(screen==='tasks'||screen==='history') loadTasks(); },[screen]);

  const advanceTask=async()=>{
    if(!task) return;
    const nextStage = stage==='Available'?'Accepted':stage==='Accepted'?'Picked up':stage==='Picked up'?'Out for delivery':'Delivered';
    try{
      const res=await api.updateDeliveryStatus(task.id,nextStage);
      setStage(nextStage);
      loadTasks();
    }catch(_e){ setStage('Delivered'); }
  };

  const TaskView=({t,onPress})=>{ return <View style={styles.card}><View style={styles.row}><View style={{flex:1}}><Text style={styles.title}>{t.food}</Text><Text style={styles.meta}>{t.qty} · {t.distance} · {t.eta}</Text></View><Badge color={t.urgency==='High'?'red':'orange'}>{t.urgency}</Badge></View><Text style={styles.meta}>● {t.from}</Text><Text style={styles.meta}>● {t.to}</Text>{onPress&&<Button small onPress={onPress}>View task</Button>}</View>; };

  if(screen==='tasks')return <RoleLayout role="volunteer" screen={screen} setScreen={setScreen} title="Delivery tasks"><Text style={styles.intro}>Nearby opportunities to make an impact.</Text>{tasks.length===0?<View style={[styles.card,{alignItems:'center',padding:28}]}><Text style={{fontSize:40}}>🍃</Text><Text style={[styles.title,{marginTop:8}]}>No active delivery tasks</Text></View>:tasks.map((t)=><TaskView key={t.id} t={t} onPress={()=>setScreen('taskdetail')}/>)}</RoleLayout>;
  if(screen==='taskdetail')return <RoleLayout role="volunteer" screen={screen} setScreen={setScreen} title="Task details">{task?<View><TaskView t={task}/><Badge color={stage==='Available'?'orange':'blue'}>{stage}</Badge><Button onPress={advanceTask}>{stage==='Available'?'Accept Task':stage==='Accepted'?'Mark Picked Up':stage==='Picked up'?'Out for Delivery':'Mark Delivered'}</Button></View>:<Button onPress={()=>setScreen('tasks')}>Back to tasks</Button>}</RoleLayout>;
  if(screen==='map')return <RoleLayout role="volunteer" screen={screen} setScreen={setScreen} title="Live route"><View style={[styles.hero,{height:330,justifyContent:'center',alignItems:'center'}]}><Text style={{fontSize:58}}>🗺️</Text><Text style={{color:'white',fontWeight:'800',marginTop:12}}>Lake View Hall  →  Hope Foundation</Text><Text style={{color:'#D4F0E4',marginTop:5}}>3.6 km · Approximately 18 minutes</Text></View></RoleLayout>;
  if(screen==='history')return <RoleLayout role="volunteer" screen={screen} setScreen={setScreen} title="Delivery history"><Text style={styles.intro}>Completed deliveries will show here.</Text><TaskView t={tasks[0]}/></RoleLayout>;
  if(screen==='profile')return <ProfileView setScreen={setScreen}/>;

  return <RoleLayout role="volunteer" screen={screen} setScreen={setScreen} title="Hello, Volunteer"><View style={styles.hero}><Text style={styles.heroKicker}>YOUR IMPACT</Text><Text style={styles.heroNumber}>36</Text><Text style={{color:'#D4F0E4'}}>deliveries completed</Text></View><View style={styles.statRow}><Stat icon="✓" value="126" label="Deliveries"/><Stat icon="🍽" value="4,280" label="Meals delivered"/></View></RoleLayout>;
}

function ProfileView({setScreen}){ return <RoleLayout role="volunteer" screen="profile" setScreen={setScreen} title="Profile"><View style={{alignItems:'center',padding:15}}><Text style={{fontSize:52}}>🚲</Text><Text style={[styles.title,{fontSize:21}]}>Rahul Verma</Text><Text style={styles.meta}>Volunteer · HSR Layout, Bengaluru</Text></View><Button ghost onPress={()=>setScreen('roles')}>Log out</Button></RoleLayout>; }
