import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../theme';
export default function EmptyState({icon='🍃',title,text}){return <View style={[styles.card,{alignItems:'center',padding:28}]}><Text style={{fontSize:38}}>{icon}</Text><Text style={[styles.title,{marginTop:8}]}>{title}</Text><Text style={[styles.meta,{textAlign:'center',marginTop:5}]}>{text}</Text></View>}
