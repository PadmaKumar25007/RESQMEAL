import React,{useState,useEffect,useCallback} from 'react';
import { View,Text,TextInput,Pressable } from 'react-native';
import { styles,colors } from '../../theme.jsx';
import { Button,Badge,Stat,FoodCard } from '../../components/UI.jsx';
import FormField from '../../components/FormField.jsx';
import { api } from '../../services/api.js';
import RoleLayout from '../../components/RoleLayout.jsx';

export default function NGOScreen({screen,setScreen,user}){

  const [donations,setDonations]=useState([]);
  const [requests,setRequests]=useState([]);
  const [loading,setLoading]=useState(false);
  const [selectedDonation,setSelectedDonation]=useState(null);
  const [sent,setSent]=useState(false);
  const [form,setForm]=useState({requiredQuantity:'',peopleToServe:'',note:''});
  const [error,setError]=useState(null);

  const loadDonations=useCallback(async()=>{ setLoading(true); try{ const res=await api.donations({status:'available'}); setDonations(res.data||[]);}catch(_e){setDonations([]);}finally{setLoading(false);} },[user]);

  const loadRequests=useCallback(async()=>{ try{ const res=await api.requests({ngoId:user?.id}); setRequests(res.data||[]);}catch(_e){setRequests([]);} },[user]);

  useEffect(()=>{ if(screen==='available'||screen==='home') loadDonations(); if(screen==='requests'||screen==='history') loadRequests(); },[screen]);

  const submitRequest=async()=>{
    if(!selectedDonation){ setError('No donation selected.'); return; }
    setError(null);
    try{
      const res=await api.createRequest({ donationId:selectedDonation.id, requiredQuantity:form.requiredQuantity, peopleToServe:Number(form.peopleToServe)||30, note:form.note });
      setSent(true);
      setRequests((r)=>[res.data,...r]);
      setDonations((d)=>d.filter((x)=>x.id!==selectedDonation.id));
    }catch(e){ setError(e.message||'Could not submit request'); }
  };

  if(screen==='available')return <RoleLayout role="ngo" screen={screen} setScreen={setScreen} title="Available nearby"><View style={styles.row}><Text style={styles.section}>Fresh donations</Text><Badge>Nearby</Badge></View>{loading?<View style={[styles.card,{alignItems:'center',padding:28}]}><Text style={styles.meta}>Loading donations…</Text></View>:donations.length===0?<View style={[styles.card,{alignItems:'center',padding:28}]}><Text style={{fontSize:40}}>🍃</Text><Text style={[styles.title,{marginTop:8}]}>No donations available right now</Text><Text style={[styles.meta,{textAlign:'center',marginTop:5}]}>Check back soon or refresh.</Text></View>:donations.map(d=><FoodCard key={d.id} item={d} onPress={()=>{setSelectedDonation(d);setScreen('fooddetail');}}/>)}</RoleLayout>;

  if(screen==='fooddetail')return <RoleLayout role="ngo" screen={screen} setScreen={setScreen} title="Food details">{selectedDonation?<View><View style={[styles.card,{alignItems:'center'}]}><Text style={{fontSize:75}}>{selectedDonation.emoji||'🍲'}</Text><Text style={[styles.title,{fontSize:21}]}>{selectedDonation.food}</Text><Text style={styles.meta}>{selectedDonation.qty} · {selectedDonation.meals} meals · {selectedDonation.place}</Text></View><View style={styles.info}><Text style={styles.title}>Freshness</Text><Text style={styles.meta}>Prepared {selectedDonation.time} · {selectedDonation.expiry}</Text></View><View style={styles.info}><Text style={styles.title}>Pickup</Text><Text style={styles.meta}>📍 {selectedDonation.place}</Text><Text style={styles.meta}>◷ {selectedDonation.expiry}</Text></View><Button onPress={()=>setScreen('request')}>Request Food</Button></View>:<Button onPress={()=>setScreen('available')}>Back to available</Button>}</RoleLayout>;

  if(screen==='request')return <RoleLayout role="ngo" screen={screen} setScreen={setScreen} title="Request food">{sent?<View style={[styles.card,{alignItems:'center',padding:28}]}><Text style={{fontSize:50}}>✓</Text><Text style={[styles.title,{fontSize:21,marginTop:10}]}>Request sent!</Text><Text style={[styles.meta,{textAlign:'center',marginTop:7}]}>The donor will be notified of your request.</Text><Button onPress={()=>setScreen('requests')}>View requests</Button></View>:<View><Text style={styles.intro}>Requesting {selectedDonation?.food}</Text><FormField label="Required quantity" value={form.requiredQuantity} onChangeText={(t)=>setForm({...form,requiredQuantity:t})}/><FormField label="People to serve" value={form.peopleToServe} onChangeText={(t)=>setForm({...form,peopleToServe:t})}/><FormField label="Note for donor" value={form.note} onChangeText={(t)=>setForm({...form,note:t})} multiline/><Button onPress={submitRequest}>Submit Request</Button>{error?<Text style={{color:colors.red,fontSize:12,fontWeight:'700'}}>{error}</Text>:null}</View>}</RoleLayout>;

  if(screen==='requests')return <RequestsList requests={requests} setScreen={setScreen} title="My requests"/>;
  if(screen==='history')return <RequestsList requests={requests} setScreen={setScreen} title="Received donations"/>;

  const availableCount=donations.length;
  const activeRequests=requests.filter((r)=>r.status==='Pending').length;
  const recommended=donations[0];

  return <RoleLayout role="ngo" screen={screen} setScreen={setScreen} title="Hello, Hope Foundation" sub="Here’s what’s happening around you"><View style={styles.hero}><Text style={styles.heroKicker}>RESCUE SNAPSHOT</Text><Text style={styles.heroNumber}>{String(availableCount).padStart(2,'0')}</Text><Text style={{color:'#D4F0E4'}}>meals available nearby</Text></View><View style={styles.statRow}><Stat icon="📦" value={String(availableCount).padStart(2,'0')} label="Available nearby"/><Stat icon="◷" value={String(activeRequests).padStart(2,'0')} label="Active requests" tint="#FFF5E4"/><Stat icon="♥" value="2,560" label="Meals received" tint="#E8F1FD"/></View><Text style={styles.section}>Recommended for you</Text>{recommended?<FoodCard item={recommended} onPress={()=>{setSelectedDonation(recommended);setScreen('fooddetail');}}/>:<Button onPress={()=>setScreen('available')}>Browse available food</Button>}</RoleLayout>;
}

function RequestsList({requests,setScreen,title}){
  return <RoleLayout role="ngo" screen="requests" setScreen={setScreen} title={title}><View style={styles.row}><Badge>Pending</Badge><Badge color="blue">Accepted</Badge><Badge color="orange">Completed</Badge></View>{requests.length===0?<View style={[styles.card,{alignItems:'center',padding:28}]}><Text style={{fontSize:40}}>🍃</Text><Text style={[styles.title,{marginTop:8}]}>No requests yet</Text></View>:requests.map((r)=>{ const d=r.donation; return <View key={r.id} style={styles.card}><Text style={styles.title}>{d?.food||'Donation'}</Text><Text style={styles.meta}>{d?.qty} · Requested {r.requiredQuantity} for {r.peopleToServe} people</Text><Badge color={r.status==='Accepted'?'blue':r.status==='Completed'?'green':'orange'}>{r.status}</Badge></View>;})}</RoleLayout>;
}
