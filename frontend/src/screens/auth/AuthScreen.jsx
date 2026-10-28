import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../../theme.jsx';
import { api, setToken } from '../../services/api.js';

const roles = [
  ['donor', '🍽', 'Food Donor', 'Share surplus food and track your impact.'],
  ['ngo', '♥', 'NGO / Recipient', 'Discover food donations near you.'],
  ['volunteer', '🚲', 'Volunteer', 'Deliver hope, one meal at a time.'],
  ['admin', '▥', 'Administrator', 'Manage the ResQMeal community.'],
];

export default function AuthScreen({ onAuth, onBack }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.login({ email, password });
      setToken(res.data.token);
      onAuth(res.data.user);
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.register({ name, email, password, role: 'donor' });
      setToken(res.data.token);
      onAuth(res.data.user);
    } catch (e) {
      setError(e.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  const quickRole = async (r) => {
    // Quick demo login: create (or reuse) an account for this role.
    setBusy(true);
    setError(null);
    try {
      const suffix = r === 'donor' ? 'donor' : r === 'ngo' ? 'ngo' : r === 'volunteer' ? 'volunteer' : 'admin';
      const res = await api.register({
        name: r === 'donor' ? 'Ananya Sharma' : r === 'ngo' ? 'Hope Foundation' : r === 'volunteer' ? 'Rahul Verma' : 'Priya Nair',
        email: `demo_${r}@resqmeal.org`,
        password: 'demo1234',
        role: r,
        organizationName: r === 'donor' ? 'Sunrise Events & Catering' : r === 'ngo' ? 'Hope Foundation Community Kitchen' : r === 'volunteer' ? null : 'ResQMeal Operations Team',
      });
      setToken(res.data.token);
      onAuth(res.data.user);
    } catch (e) {
      // Account may already exist; try login instead
      try {
          const res = await api.login({ email: `demo_${r}@resqmeal.org`, password: 'demo1234' });
          setToken(res.data.token);
          onAuth(res.data.user);
        } catch (_e2) {
          setError(e.message || 'Unable to continue');
        }
      } finally {
        setBusy(false);
      }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={onBack}>
          <Text style={{ color: colors.green, fontWeight: '800' }}>‹ Back</Text>
        </Pressable>
        <Text style={[styles.title, { fontSize: 29, marginTop: 18 }]}>Welcome to ResQMeal</Text>
        <Text style={styles.intro}>Log in or create an account to continue saving food.</Text>

        {mode === 'login' ? (
          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.org" autoCapitalize="none" keyboardType="email-address" />
            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
            {error ? <Text style={{ color: colors.red, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>{error}</Text> : null}
            <Pressable style={styles.button} onPress={handleLogin} disabled={busy}>
              <Text style={styles.buttonText}>{busy ? 'Logging in…' : 'Log in'}</Text>
            </Pressable>
            <Pressable style={styles.card} onPress={() => setMode('register')}>
              <Text style={{ color: colors.green, fontWeight: '800', textAlign: 'center' }}>Create account</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.label}>Full name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ananya Sharma" />
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.org" autoCapitalize="none" keyboardType="email-address" />
            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry />
            {error ? <Text style={{ color: colors.red, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>{error}</Text> : null}
            <Pressable style={styles.button} onPress={handleRegister} disabled={busy}>
              <Text style={styles.buttonText}>{busy ? 'Creating…' : 'Create donor account'}</Text>
            </Pressable>
            <Pressable onPress={() => setMode('login')}>
              <Text style={{ color: colors.green, fontWeight: '800', textAlign: 'center', marginTop: 10 }}>Back to login</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.section}>Or continue as</Text>
        {roles.map((r) => (
          <Pressable key={r[0]} style={styles.roleCard} onPress={() => quickRole(r[0])}>
            <View style={styles.roleIcon}>
              <Text style={{ fontSize: 27 }}>{r[1]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{r[2]}</Text>
              <Text style={styles.meta}>{r[3]}</Text>
            </View>
            <Text style={{ fontSize: 25, color: '#97AAA2' }}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
