import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

const pastelGreen = '#E6F5DE';
const mainText = '#5C7C6E';
const accent = '#F4A261';
const CARD_WIDTH = Math.min(340, Dimensions.get('window').width * 0.92);

const STORAGE_KEYS = {
  ARRIVAL: '@findoors:arrival_date',
  DEPARTURE: '@findoors:departure_date',
};

interface DateSlot {
  date: Date;
  type: 'arrival' | 'departure';
}

// Predefined dates
const ARRIVAL_DATES = [
  new Date(2025, 5, 1),  // June 1
  new Date(2025, 5, 16), // June 16
  new Date(2025, 5, 30), // June 30
  new Date(2025, 6, 14), // July 14
  new Date(2025, 6, 28), // July 28
  new Date(2025, 7, 11), // August 11
];

const DEPARTURE_DATES = [
  new Date(2025, 5, 16), // June 16
  new Date(2025, 5, 30), // June 30
  new Date(2025, 6, 14), // July 14
  new Date(2025, 6, 28), // July 28
  new Date(2025, 7, 11), // August 11
  new Date(2025, 7, 30), // August 30
];

export default function DateScreen() {
  const [slots, setSlots] = useState<DateSlot[]>([]);
  const [arrivalDate, setArrivalDate] = useState<Date | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const isDark = useColorScheme() === 'dark';

  // Load saved dates from AsyncStorage
  useEffect(() => {
    const loadSavedDates = async () => {
      try {
        const savedArrival = await AsyncStorage.getItem(STORAGE_KEYS.ARRIVAL);
        const savedDeparture = await AsyncStorage.getItem(STORAGE_KEYS.DEPARTURE);
        
        if (savedArrival) setArrivalDate(new Date(savedArrival));
        if (savedDeparture) setDepartureDate(new Date(savedDeparture));
      } catch (error) {
        console.error('Error loading saved dates:', error);
      }
    };
    loadSavedDates();
  }, []);

  useEffect(() => {
    const arrivalSlots: DateSlot[] = ARRIVAL_DATES.map(d => ({ date: d, type: 'arrival' }));
    const departureSlots: DateSlot[] = DEPARTURE_DATES.map(d => ({ date: d, type: 'departure' }));
    setSlots([...arrivalSlots, ...departureSlots]);
  }, []);

  // Save dates to AsyncStorage whenever they change
  const handleSelectArrival = async (date: Date) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ARRIVAL, date.toISOString());
      setArrivalDate(date);
      setDepartureDate(null); // Reset departure date when arrival changes
      await AsyncStorage.removeItem(STORAGE_KEYS.DEPARTURE);
    } catch (error) {
      console.error('Error saving arrival date:', error);
    }
  };

  const handleSelectDeparture = async (date: Date) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DEPARTURE, date.toISOString());
      setDepartureDate(date);
    } catch (error) {
      console.error('Error saving departure date:', error);
    }
  };

  // available departures after arrival
  const departureOptions = slots
    .filter(s => s.type === 'departure' && arrivalDate && s.date > arrivalDate)
    .map(s => s.date);

  return (
    <View style={[styles.dateContainer, isDark && { backgroundColor: '#181c1b' }]}> 
      <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
        <Text style={[styles.backLinkText, isDark && { color: '#E6F5DE' }]}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.dateDateContainer}>
        <Text style={[styles.dateTitle, isDark && { color: '#E6F5DE' }]}>Select arrival date</Text>
        <ScrollView
          horizontal
          contentContainerStyle={styles.dateList}
          showsHorizontalScrollIndicator={false}
        >
          {slots
            .filter(s => s.type === 'arrival')
            .map(({ date }) => {
              const isSel = arrivalDate && date.getTime() === arrivalDate.getTime();
              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  onPress={() => handleSelectArrival(date)}
                  style={[
                    styles.dateCard,
                    {
                      borderColor: isSel ? accent : 'transparent',
                      backgroundColor: isSel ? accent : (isDark ? '#232825' : '#FFF'),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dateText,
                      { color: isSel ? '#FFF' : (isDark ? '#E6F5DE' : mainText) },
                    ]}
                  >
                    {date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      </View>

      <View style={styles.dateDateContainer}>
        {arrivalDate && (
          <>
            <Text style={[styles.dateTitle, { marginTop: 24 }, isDark && { color: '#E6F5DE' }]}>Select departure date</Text>
            <ScrollView
              horizontal
              contentContainerStyle={styles.dateList}
              showsHorizontalScrollIndicator={false}
            >
              {departureOptions.map((date) => {
                const isSel =
                  departureDate && date.getTime() === departureDate.getTime();
                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    onPress={() => handleSelectDeparture(date)}
                    style={[
                      styles.dateCard,
                      {
                        borderColor: isSel ? accent : 'transparent',
                        backgroundColor: isSel ? accent : (isDark ? '#232825' : '#FFF'),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateText,
                        { color: isSel ? '#FFF' : (isDark ? '#E6F5DE' : mainText) },
                      ]}
                    >
                      {date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}
      </View>

      <View style={styles.statsContainer}>
        <Text style={[styles.statsText, isDark && { color: '#E6F5DE' }]}>Wow, you will be coding at least{' '}
          <Text style={styles.statsNumber}>
            {40 *
              (departureDate && arrivalDate
                ? Math.ceil(
                    (departureDate.getTime() - arrivalDate.getTime()) /
                      (1000 * 60 * 60 * 24 * 7)
                  )
                : 0)}
          </Text>{' '}
          hours this summer! Way to go!
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.nextButton,
          {
            opacity: arrivalDate && departureDate ? 1 : 0.6,
            backgroundColor:
              arrivalDate && departureDate ? accent : '#F8CDA1',
          },
        ]}
        disabled={!(arrivalDate && departureDate)}
        onPress={() => {
          if (arrivalDate && departureDate) {
            router.push('/welcome/fellows');
          }
        }}
      >
        <Text style={styles.nextButtonText}>Continue →</Text>
      </TouchableOpacity>
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
    fontWeight: '900',
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
  statsText: {
    fontSize: 18,
    color: mainText,
    lineHeight: 24,
    fontWeight: '500',
  },
  statsNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: accent,
  },
});