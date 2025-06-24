import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useColorScheme } from 'react-native';

const Loading = () => {
  const isDark = useColorScheme() === 'dark';

  return (
    <View style={[styles.centered, { backgroundColor: isDark ? '#181C1B' : '#FFFFFF' }]}>
      <ActivityIndicator size="large" color={ isDark ? '#c3ccc8' : "#007AFF"} />
      <Text style={[styles.loadingText, { color: isDark ? '#e1e6e4' : '#171717' }]}>Loading...</Text>
    </View>
  );
};

export default Loading; 

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});