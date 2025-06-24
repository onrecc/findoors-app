import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

const slides = [
  {
    icon: '🗺️',
    title: 'Explore SF',
    text: 'See your houses, SF sights, food spots & more — all on a live interactive map.',
  },
  {
    icon: '📸',
    title: 'Earn Stamps',
    text: 'Get digital passport stamps for visiting places, doing challenges, and taking photos.',
  },
  {
    icon: '👥',
    title: 'Find Your Crew',
    text: 'Check where your friends are, chat, or join spontaneous journeys together.',
  },
];

const { width } = Dimensions.get('window');

export default function GuideScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isDark = useColorScheme() === 'dark';

  const onScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#181c1b' }]}> 
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <Text style={styles.icon}>{slide.icon}</Text>
            <Text style={[styles.title, isDark && { color: '#E6F5DE' }]}>{slide.title}</Text>
            <Text style={[styles.text, isDark && { color: '#B4CBA5' }]}>{slide.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              currentIndex === i && (isDark ? styles.dotActiveDark : styles.dotActive),
            ]}
          />
        ))}
      </View>
      {currentIndex === slides.length - 1 && (
        <TouchableOpacity
          style={[styles.button, isDark && { backgroundColor: '#F4A261' }]}
          onPress={() => {
            router.dismissAll();
            router.replace('/');
          }}
          activeOpacity={0.87}
        >
          <Text style={styles.buttonText}>Let’s Start!</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8E8',
    alignItems: 'center',
    justifyContent: 'center', 
  },
  slide: {
    width,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5C7C6E',
    marginBottom: 10,
    textAlign: 'center',
  },
  text: {
    fontSize: 18,
    color: '#7A8D7B',
    textAlign: 'center',
    lineHeight: 26,
  },
  button: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: '#F4A261',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  dots: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 110,
    justifyContent: 'center',
    width: '100%',
  },
  dot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#B4CBA5',
    marginHorizontal: 6,
  },
  dotActive: {
    backgroundColor: '#5C7C6E',
    width: 14,
  },
  dotActiveDark: {
    backgroundColor: '#E6F5DE',
    width: 14,
  },
});