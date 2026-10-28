import React,{useState,useEffect,useCallback} from 'react';
import { View,Text,TextInput,Pressable,Image,ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { styles,colors } from '../../theme.jsx';
import { Button,Badge,Stat,FoodCard } from '../../components/UI.jsx';
import FormField from '../../components/FormField.jsx';
import { donations as fallbackDonations } from '../../data/mockData.js';
import { api } from '../../services/api.js';
import RoleLayout from '../../components/RoleLayout.jsx';

export default function DonorScreen({screen,setScreen,user}){

  const [donations,setDonations]=useState(fallbackDonations);
  const [loadingDonations,setLoadingDonations]=useState(false);
  const [posted,setPosted]=useState(false);
  const [form,setForm]=useState({foodName:'',category:'Cooked meal',quantity:'',servings:'30',bestBefore:'',pickupLocation:'',description:''});
  const [imageUri,setImageUri]=useState(null);
  const [imageBase64,setImageBase64]=useState(null);
  const [imageMime,setImageMime]=useState('image/jpeg');
  const [aiStatus,setAiStatus]=useState('idle');
  const [aiResult,setAiResult]=useState(null);
  const [aiError,setAiError]=useState(null);
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState(null);

  const loadDonations=useCallback(async()=>{ setLoadingDonations(true); try{ const res=await api.donations({donorId:user?.id}); setDonations(res.data||[]);}catch(_e){setDonations(fallbackDonations);}finally{setLoadingDonations(false);} },[user]);

  useEffect(()=>{ if(screen==='donations'||screen==='home') loadDonations(); },[screen,loadDonations]);

  const launchImagePicker=async(target)=>{
    try{
      const permission=target==='camera'?await ImagePicker.requestCameraPermissionsAsync():await ImagePicker.requestMediaLibraryPermissionsAsync();
      if(!permission.allowed){ setAiError('Permission denied. Please allow camera/photo library access.'); return; }
      const result=target==='camera'?await ImagePicker.launchCameraAsync({allowsEditing:false,quality:0.8}):await ImagePicker.launchImageLibraryAsync({allowsEditing:false,quality:0.8});
      if(!result.cancelled && result.assets && result.assets[0]){
        const asset=result.assets[0];
        setImageUri(asset.uri);
        const fs=await FileSystem.readAsBase64Async(asset.uri);
        setImageBase64(fs.base64);
        const ext=(asset.uri.split('?')[0].split('.').pop()||'').toLowerCase();
        setImageMime(ext==='png'?'image/png':ext==='jpg'||ext==='jpeg'?'image/jpeg':'image/png');
      }
    }catch(_e){ setAiError('Could not open camera or gallery.'); }
  };

  const recognizeFood=async()=>{
    if(!imageBase64){ setAiStatus('error'); setAiError('Please select or capture a food image first.'); return; }
    setAiStatus('loading'); setAiError(null); setAiResult(null);
    try{
      const res=await api.aiPredict(imageBase64,imageMime);
      if(res?.success===false){ setAiStatus('error'); setAiError(res?.message||'AI prediction failed'); return; }
      setAiResult(res);
      setAiStatus('success');
      if(res?.detected && res?.food){ setForm((f)=>({...f,foodName:String(res.food).replace(/_/g,' ')})); }
    }catch(e){ setAiStatus('error'); setAiError(e.message||'AI prediction failed'); }
  };

  const submitDonation=async()=>{
    if(!form.foodName || !form.quantity || !form.pickupLocation){ setSaveError('Please fill food name, quantity and pickup location.'); return; }
    setSaving(true); setSaveError(null);
    try{
      const payload={ foodName:form.foodName, category:form.category, quantity:form.quantity, servings:Number(form.servings)||30, pickupLocation:form.pickupLocation, description:form.description, imageUrl:imageUri };
      await api.createDonation(payload);
      setPosted(true);
      setForm({foodName:'',category:'Cooked meal',quantity:'',servings:'30',bestBefore:'',pickupLocation:'',description:''});
      setImageUri(null); setImageBase64(null); setAiStatus('idle'); setAiResult(null);
      loadDonations();
    }catch(e){ setSaveError(e.message||'Could not save donation'); }
    finally{ setSaving(false); }
  };

  if(screen==='donate')return <DonateScreen setScreen={setScreen} user={user} posted={posted} setPosted={setPosted} form={form} setForm={setForm} imageUri={imageUri} setImageUri={setImageUri} imageBase64={imageBase64} setImageBase64={setImageBase64} imageMime={imageMime} setImageMime={setImageMime} aiStatus={aiStatus} setAiStatus={setAiStatus} aiResult={aiResult} setAiResult={setAiResult} aiError={aiError} setAiError={setAiError} saving={saving} setSaving={setSaving} saveError={saveError} setSaveError={setSaveError} launchImagePicker={launchImagePicker} recognizeFood={recognizeFood} submitDonation={submitDonation} loadDonations={loadDonations}/>;
  if(screen==='profile')return <ProfileView user={user} setScreen={setScreen}/>;
  if(screen==='detail')return <DetailView donation={donations[0]} setScreen={setScreen}/>;
  if(screen==='donations')return <DonationsView donations={donations} loading={loadingDonations} setScreen={setScreen}/>;

  const name=user?.name||'Ananya Sharma';
  const organization=user?.organizationName;
  const recent=donations[1]||donations[0];
  return <RoleLayout role="donor" screen={screen} setScreen={setScreen} title={`Good morning, ${name}`} sub={organization?`${organization} · Verified donor`:'Every meal you share creates a difference'}><View style={styles.hero}><Text style={styles.heroKicker}>YOUR IMPACT THIS MONTH</Text><Text style={styles.heroNumber}>1,240 meals</Text><Text style={{color:'#D4F0E4'}}>have reached 31 families</Text></View><View style={styles.statRow}><Stat icon="🍽" value="1,840" label="Meals donated"/><Stat icon="◷" value="03" label="Active" tint="#FFF5E4"/><Stat icon="✓" value="26" label="Completed" tint="#E8F1FD"/></View><Text style={styles.section}>Recent donations</Text>{recent?<FoodCard item={recent} onPress={()=>setScreen('detail')}/>:<Button onPress={()=>setScreen('donate')}>＋ Donate Food</Button>}</RoleLayout>;
}

function DonateScreen({setScreen,user,posted,setPosted,form,setForm,imageUri,setImageUri,imageBase64,setImageBase64,imageMime,setImageMime,aiStatus,setAiStatus,aiResult,setAiResult,aiError,setAiError,saving,setSaving,saveError,setSaveError,launchImagePicker,recognizeFood,submitDonation,loadDonations}){

  if(posted)return <RoleLayout role="donor" screen="donate" setScreen={setScreen} title="Donate food"><View style={[styles.card,{alignItems:'center',padding:28}]}><Text style={{fontSize:50}}>✓</Text><Text style={[styles.title,{fontSize:21,marginTop:10}]}>Donation Posted Successfully</Text><Text style={[styles.meta,{textAlign:'center',marginTop:7}]}>Nearby verified NGOs can now discover your food.</Text><Button onPress={()=>setScreen('donations')}>View my donations</Button></View></RoleLayout>;

  return <RoleLayout role="donor" screen="donate" setScreen={setScreen} title="Donate food"><Text style={styles.intro}>Share surplus food with people who need it.</Text><FormField label="Food name" value={form.foodName} onChangeText={(t)=>setForm({...form,foodName:t})}/><Text style={styles.label}>Category</Text><View style={styles.row}><Badge>Cooked meal</Badge><Badge color="blue">Bakery</Badge><Badge color="blue">Produce</Badge></View><View style={styles.row}><View style={{flex:1}}><FormField label="Quantity" value={form.quantity} onChangeText={(t)=>setForm({...form,quantity:t})}/></View><View style={{width:10}}/><View style={{flex:1}}><FormField label="Servings" value={form.servings} onChangeText={(t)=>setForm({...form,servings:t})}/></View></View><FormField label="Best before" value={form.bestBefore} onChangeText={(t)=>setForm({...form,bestBefore:t})}/><FormField label="Pickup location" value={form.pickupLocation} onChangeText={(t)=>setForm({...form,pickupLocation:t})}/><FormField label="Description" value={form.description} onChangeText={(t)=>setForm({...form,description:t})} multiline/><Pressable style={[styles.card,{alignItems:'center',borderStyle:'dashed'}]} onPress={()=>launchImagePicker('library')}><Text style={{fontSize:25}}>📷</Text><Text style={styles.title}>Add food photo</Text>{imageUri?<Image source={{uri:imageUri}} style={{width:120,height:120,borderRadius:12}}/>:<Text style={styles.meta}>Tap to add a photo</Text>}</Pressable><View style={styles.row}><Button small onPress={()=>launchImagePicker('camera')}>Take photo</Button><Button small onPress={()=>launchImagePicker('library')}>Pick photo</Button></View><Button onPress={recognizeFood} disabled={aiStatus==='loading'}>{aiStatus==='loading'?'Recognizing…':'Recognize Food'}</Button>{aiStatus==='loading'&&<ActivityIndicator/>}{aiError?<Text style={{color:colors.red,fontSize:12,fontWeight:'700'}}>{aiError}</Text>:null}{aiStatus==='success'&&aiResult?<View style={styles.info}><Text style={styles.title}>AI Detection</Text>{aiResult.detected?<><Text style={{fontSize:16,fontWeight:'800',color:colors.green}}>{aiResult.food}</Text><Text style={styles.meta}>Confidence: {(aiResult.confidence*100).toFixed(1)}%</Text>{aiResult.bbox?<Text style={styles.meta}>Box: x={aiResult.bbox.x.toFixed(2)} y={aiResult.bbox.y.toFixed(2)} w={aiResult.bbox.width.toFixed(2)} h={aiResult.bbox.height.toFixed(2)}</Text>:null}</>:<Text style={styles.meta}>{aiResult.message||'No food detected'}</Text>}</View>:<Text style={[styles.meta,{textAlign:'center'}]}>No supported food detected. Try a clearer photo of the food.</Text>}<Button onPress={submitDonation} disabled={saving}>{saving?'Saving…':'Post Donation'}</Button>{saveError?<Text style={{color:colors.red,fontSize:12,fontWeight:'700'}}>{saveError}</Text>:null}</View></RoleLayout>;
}

function ProfileView({user,setScreen}){ return <RoleLayout role="donor" screen="profile" setScreen={setScreen} title="Profile"><View style={{alignItems:'center',padding:15}}><Text style={{fontSize:52}}>👩🏻</Text><Text style={[styles.title,{fontSize:21}]}>{user?.name||'Ananya Sharma'}</Text><Text style={styles.meta}>{user?.organizationName||'Sunrise Events & Catering'} · Verified donor</Text></View><Text style={styles.section}>Your impact</Text><View style={styles.statRow}><Stat icon="🍽" value="1,840" label="Meals"/><Stat icon="✓" value="26" label="Completed"/></View><Button ghost onPress={()=>setScreen('roles')}>Log out</Button></View></RoleLayout>; }

function DonationsView({donations,loading,setScreen}){ if(loading)return <View style={[styles.card,{alignItems:'center',padding:28}]}><ActivityIndicator/><Text style={styles.meta}>Loading donations…</Text></View>; if(!donations||donations.length===0)return <View style={[styles.card,{alignItems:'center',padding:28}]}><Text style={{fontSize:40}}>🍃</Text><Text style={[styles.title,{marginTop:8}]}>No donations yet</Text><Text style={[styles.meta,{textAlign:'center',marginTop:5}]}>When you post surplus food, it will appear here.</Text></View>; return <View><Text style={styles.section}>Donation history</Text>{donations.map(d=><FoodCard key={d.id} item={d} onPress={()=>setScreen('detail')}/>)}</View>; }

function DetailView({donation,setScreen}){ return <RoleLayout role="donor" screen="detail" setScreen={setScreen} title="Donation details"><FoodCard item={donation}/><View style={styles.info}><Text style={styles.title}>Donation timeline</Text><Text style={styles.meta}>Posted today, 4:05 PM</Text><Text style={styles.meta}>Available for pickup · Expires in 3h 25m</Text></View><Button onPress={()=>setScreen('donations')}>Back to my donations</Button></RoleLayout>; }
