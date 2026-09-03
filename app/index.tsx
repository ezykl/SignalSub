import React from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

export default function Index() {
  return (
    <View
      className="flex-1 items-center justify-center bg-primary px-6"
      style={{ flex: 1, backgroundColor: '#0F0F1A', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <StatusBar style="light" />
      <Text
        className="text-3xl font-bold text-text-primary mb-2"
        style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 }}
      >
        SignalSub
      </Text>
      <Text
        className="text-base text-text-secondary text-center"
        style={{ fontSize: 16, color: '#94A3B8', textAlign: 'center' }}
      >
        Never get surprised by an auto-charge.
      </Text>
    </View>
  );
}
