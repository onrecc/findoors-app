// app/screens/StampsScreen.js
import { useAchievements } from '@/lib/AchievementContext';
import { STAMP_DEFINITIONS } from '@/lib/stamps';
import { Stack } from 'expo-router';
import React, { useMemo } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';

const { width } = Dimensions.get('window');
const STICKER_SIZE = width / 3;

export default function StampsScreen() {
  const { achievements } = useAchievements();
  const isDark = useColorScheme() === 'dark';
  const styles = isDark ? stylesDark : stylesLight;

  // Merge definitions with unlocked status and random layout
  const stamps = useMemo(
    () =>
      STAMP_DEFINITIONS.map((stamp) => ({
        ...stamp,
        unlocked: achievements.some((a) => a.id === stamp.id),
        rotation: (Math.random() - 0.5) * 30,
        margin: 12 + Math.random() * 12,
      })),
    [achievements]
  );

  // Chunk into pages of 6
  const pages = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < stamps.length; i += 6) {
      chunks.push(stamps.slice(i, i + 6));
    }
    return chunks;
  }, [stamps]);

  const renderStamp = (stamp) => (
    <View
      key={stamp.id}
      style={[
        styles.sticker,
        { transform: [{ rotate: `${stamp.rotation}deg` }], margin: stamp.margin },
      ]}
    >
      <Image
        source={typeof stamp.image === 'string' ? { uri: stamp.image } : stamp.image}
        style={[styles.image, !stamp.unlocked && styles.lockedImage]}
      />
      {!stamp.unlocked && <Text style={styles.lock}>🔒</Text>}
      <Text style={[styles.label, !stamp.unlocked && styles.lockedLabel]} numberOfLines={2}>
        {stamp.name}
      </Text>
      <Text style={[styles.desc, !stamp.unlocked && styles.lockedDesc]} numberOfLines={3}>
        {stamp.description || 'No description available.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={!isDark ? {
          title: 'My Passport Stamps',
          headerStyle: { backgroundColor: '#FAF3E0' },
          headerTitleStyle: { color: '#5C4B51', fontSize: 24, fontWeight: 'bold' },
          headerTintColor: '#5C4B51',
          headerShadowVisible: false,
        } : {
          title: 'My Passport Stamps',
          headerStyle: { backgroundColor: '#23212b' },
          headerTitleStyle: { color: '#f5e9d7', fontSize: 24, fontWeight: 'bold' },
          headerTintColor: '#f5e9d7',
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pagingContainer}
      >
        {pages.map((pageStamps, idx) => (
          <View style={styles.page} key={idx}>
            {pageStamps.map(renderStamp)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const stylesLight = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3E0',
    paddingBottom: 30,
  },
  pagingContainer: {},
  page: {
    width,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignContent: 'space-around',
    paddingBottom: 40,
  },
  sticker: {
    width: STICKER_SIZE,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#FFF5E5',
    padding: 8,
  },
  image: {
    width: STICKER_SIZE * 0.7,
    height: STICKER_SIZE * 0.7,
    resizeMode: 'contain',
  },
  lock: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 24,
    opacity: 0.6,
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#5C4B51',
    textAlign: 'center',
  },
  lockedLabel: {
    color: '#A69F9A',
  },
  lockedImage: {
    opacity: 0.5,
  },
  desc: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '500',
    color: '#5C4B51',
    textAlign: 'center',
  },
  lockedDesc: {
    color: '#A69F9A',
  },
});

const stylesDark = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23212b',
    paddingBottom: 30,
  },
  pagingContainer: {},
  page: {
    width,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignContent: 'space-around',
    paddingBottom: 40,
  },
  sticker: {
    width: STICKER_SIZE,
    alignItems: 'center',
    backgroundColor: '#2e2c38',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#3a3746',
    padding: 8,
  },
  image: {
    width: STICKER_SIZE * 0.7,
    height: STICKER_SIZE * 0.7,
    resizeMode: 'contain',
  },
  lock: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 24,
    opacity: 0.7,
    color: '#bdbdbd',
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#f5e9d7',
    textAlign: 'center',
  },
  lockedLabel: {
    color: '#7a7670',
  },
  lockedImage: {
    opacity: 0.4,
  },
  desc: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '500',
    color: '#f5e9d7',
    textAlign: 'center',
  },
  lockedDesc: {
    color: '#7a7670',
  },
});