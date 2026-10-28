import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { styles } from '../../theme.jsx';
import { api } from '../../services/api.js';

export default function AIFeaturesScreen({ onBack }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.aiHealth();
        if (mounted) { setHealth(res?.ai || null); }
      } catch (_e) {
        if (mounted) { setHealth(null); }
      } finally {
        if (mounted) { setLoading(false); }
      }
    };
    load();
    return function () { mounted = false; };
  }, []);

  const cards = [
    ['📷', 'Food image recognition', health ? `${health.status === 'ok' ? 'Service online' : 'Service offline'} · YOLO model ready` : 'Checking service…'],
    ['⚖️', 'Quantity estimation', 'Coming soon · based on image analysis'],
    ['✨', 'Freshness prediction', 'Coming soon · based on expiry data'],
    ['🎯', 'Smart NGO match', 'Coming soon · based on location'],
    ['📈', 'Waste prediction', 'Coming soon · based on surplus patterns'],
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={onBack}>
        <Text style={{ color: '#087F5B', fontWeight: '800' }}>‹ Back</Text>
      </Pressable>
      <Text style={[styles.title, { fontSize: 29, marginTop: 28 }]}>AI that helps every meal count</Text>
      <Text style={[styles.meta, { marginVertical: 12 }]}>{`Real YOLO-based food recognition is now connected. Upload a photo from the Donate Food screen to detect the food.`}</Text>
      {cards.map(c => (
        <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]} key={c[1]}>
          <Text style={{ fontSize: 29 }}>{c[0]}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{c[1]}</Text>
            <Text style={styles.meta}>{c[2]}</Text>
          </View>
          <Text style={{ fontSize: 24, color: '#97AAA2' }}>›</Text>
        </View>
      ))}
    </ScrollView>
  );
}
