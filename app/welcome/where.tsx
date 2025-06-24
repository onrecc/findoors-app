import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

const houses = [
  {
    name: 'Atelier',
    location: 'Lower Haight',
    color: '#F6F6D9',
    emoji: '🎨',
    image: require('@/assets/houses/LowerHaight.png'),
  },
  {
    name: 'Casa',
    location: 'Mission',
    color: '#F9E5DC',
    emoji: '🌵',
    image: require('@/assets/houses/Mission.png'),
  },
  {
    name: 'Jiā',
    location: 'Sunset',
    color: '#D4ECE8',
    emoji: '🌅',
    image: require('@/assets/houses/Sunset.png'),
  },
];

const pastelGreen = '#E6F5DE';
const mainText = '#5C7C6E';
const accent = '#F4A261';
const CARD_WIDTH = Math.min(340, Dimensions.get('window').width * 0.92);

export default function WhereScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [anim] = useState(new Animated.Value(0));
  const router = useRouter();

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleNext = async () => {
    const house = houses.find((h) => h.name === selected);
    if (house) {
      await AsyncStorage.setItem('@findoors:house', house.name);
      router.push('/welcome/when');
    }
  };

  const isDark = useColorScheme() === 'dark';

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#181c1b' }, { paddingTop: Platform.OS === 'ios' ? 48 : 26 }]}>
      <ScrollView
        style={{ width: '100%' }}
        contentContainerStyle={{
          ...styles.scrollArea,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, isDark && { color: '#E6F5DE' }]}>Pick your House!</Text>
        <Text style={styles.disclaimer}>
          (Just for fun! Doesn’t affect your real house in Neighborhood.)
        </Text>
        <View style={styles.housesList}>
          {houses.map((house, idx) => (
            <Animated.View
              key={house.name}
              style={{
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [60 + idx * 10, 0],
                    }),
                  },
                ],
                width: '100%',
                alignItems: 'center',
              }}
            >
                <TouchableOpacity
                  style={[
                    styles.houseCard,
                    {
                      backgroundColor: isDark
                        ? `${house.color}25`
                        : house.color,
                      borderColor: isDark
                        ? (selected === house.name ? accent : `${house.color}25`)
                        : (selected === house.name ? accent : house.color),
                      transform:
                        selected === house.name
                          ? [{ scale: 1.06 }]
                          : [{ scale: 1 }],
                      shadowOpacity: selected === house.name ? 0.19 : 0.11,
                    },
                  ]}
                  onPress={() => setSelected(house.name)}
                  activeOpacity={0.88}
                >
                  <Image
                    source={house.image}
                    style={[styles.houseImage, {
                      borderColor: isDark
                        ? (selected === house.name ? `${accent}50` : `${house.color}25`)
                        : (selected === house.name ? `${accent}50` : `${house.color}25`),
                    }]}
                    resizeMode="cover"
                  />
                  <Text style={[styles.houseName, isDark && { color: '#E6F5DE' }]}>
                    {house.name} {house.emoji}
                  </Text>
                  <Text style={styles.houseLocation}>{house.location}</Text>
                  {selected === house.name && (
                    <Text style={styles.selectedText}>✓ Selected</Text>
                  )}
                </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.nextButton,
          {
            opacity: selected ? 1 : 0.6,
            backgroundColor: selected ? accent : '#F8CDA1',
          },
        ]}
        activeOpacity={selected ? 0.87 : 1}
        disabled={!selected}
        onPress={handleNext}
      >
        <Text style={styles.nextButtonText}>When?</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>🏡 Your house, your style!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pastelGreen,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  scrollArea: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 48 : 26,
    paddingBottom: 200,
    minHeight: Dimensions.get('window').height,
  },
  title: {
    fontSize: 29,
    fontWeight: '800',
    color: mainText,
    textAlign: 'center',
    letterSpacing: 1.2,
    marginBottom: 10,
    fontFamily:
      Platform.OS === 'ios' ? 'AvenirNext-Heavy' : 'sans-serif-condensed',
  },
  disclaimer: {
    fontSize: 13,
    color: '#B4CBA5',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
    maxWidth: 290,
  },
  housesList: {
    width: '100%',
    alignItems: 'center',
    marginTop: 3,
    marginBottom: 34,
  },
  houseCard: {
    width: CARD_WIDTH,
    borderRadius: 32,
    paddingVertical: 32,
    paddingHorizontal: 18,
    marginBottom: 22,
    alignItems: 'center',
    shadowColor: '#7A8D7B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.11,
    shadowRadius: 11,
    elevation: 5,
    borderWidth: 3,
    marginHorizontal: 2,
  },
  houseImage: {
    width: CARD_WIDTH - 44,
    height: 180,
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: '#FAFDF7',
    borderWidth: 2,
    borderColor: '#E1EDD6',
  },
  houseName: {
    fontSize: 24,
    color: mainText,
    fontWeight: 'bold',
    letterSpacing: 1.1,
    marginBottom: 2,
    textAlign: 'center',
  },
  houseLocation: {
    fontSize: 16,
    color: '#9CB49D',
    marginBottom: 8,
    textAlign: 'center',
  },
  selectedText: {
    marginTop: 10,
    color: accent,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  nextButton: {
    position: 'absolute',
    bottom: 62,
    left: '10%',
    right: '10%',
    paddingVertical: 18,
    borderRadius: 33,
    alignItems: 'center',
    shadowColor: accent,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 7,
    zIndex: 2,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 21,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#7A8D7B',
    fontSize: 16,
    fontWeight: 'bold',
    opacity: 0.85,
  },

  // DateScreen styles
  dateContainer: {
    backgroundColor: pastelGreen,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    alignItems: 'flex-start',
    width: '100%',
    height: '100%', 
  },
  backLink: {
    marginLeft: 16,
    marginBottom: 12,
  },
  backLinkText: {
    fontSize: 18,
    color: mainText,
    fontWeight: 'bold',
  },
  dateTitle: {
    fontSize: 24,
    color: mainText,
    marginLeft: 16,
    marginBottom: 12,
    fontWeight: '600',
  },
  dateList: {
    paddingHorizontal: 16,
  },
  dateCard: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 2,
    marginRight: 12,
    backgroundColor: '#FFF',
    height: 60,
    alignContent: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dateDateContainer: {
    width: '100%',
    paddingBottom: 24,
    paddingHorizontal: 16,
    height: '20%',
  },
  statsContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 24,
    alignItems: 'flex-start',
  },
});