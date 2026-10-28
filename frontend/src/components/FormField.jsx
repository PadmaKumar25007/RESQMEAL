import React from 'react';
import { Text, TextInput } from 'react-native';
import { styles } from '../theme';
export default function FormField({label,...props}){return <><Text style={styles.label}>{label}</Text><TextInput style={styles.input} {...props}/></>}
