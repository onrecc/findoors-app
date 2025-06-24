import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const pastelGreen = '#E6F5DE';
const mainText = '#5C7C6E';
const accent = '#F4A261';

interface Resident {
  uid: string;
  name: string;
  house: string;
  arrival: string;
  departure: string;
  hidden: boolean;
  country?: string;
  age?: number;
  public_profile?: boolean;
}

export default function FellowsScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const [userUid, setUserUid] = useState<string | null>(null);
  const [userHouse, setUserHouse] = useState<string | null>(null);
  const [hideMe, setHideMe] = useState(false);
  const [showProfile, setShowProfile] = useState(true);
  const [yourHousemates, setYourHousemates] = useState<Resident[]>([]);
  const [others, setOthers] = useState<Resident[]>([]);

  const loadUserData = async () => {
    const arrivalStr = await AsyncStorage.getItem('@findoors:arrival_date');
    const departureStr = await AsyncStorage.getItem('@findoors:departure_date');
    const house = await AsyncStorage.getItem('@findoors:house');
    const name = await AsyncStorage.getItem('@findoors:name') || 'Anonymous';

    const { data: session } = await supabase.auth.getSession();
    const uid = session?.session?.user.id;
    if (!uid || !arrivalStr || !departureStr || !house) return;

    setUserUid(uid);
    setUserHouse(house);

    const { data: existing } = await supabase
      .from('residents')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();

    if (!existing) {
      await supabase.from('residents').insert({
        uid,
        name,
        house,
        arrival: arrivalStr,
        departure: departureStr,
        hidden: false,
        public: false,
      });
    }

    const { data, error } = await supabase
      .from('residents')
      .select('*')
      .filter('arrival', 'lte', departureStr)
      .filter('departure', 'gte', arrivalStr);

    if (error) return console.error('Fetch error:', error);

    const visible = (data || []).filter(
      (r: Resident) => !r.hidden || r.uid === uid
    );

    const mine: Resident[] = [];
    const other: Resident[] = [];

    for (const r of visible) {
      if (r.uid === uid) {
        setHideMe(r.hidden ?? false);
        setShowProfile(r.public_profile ?? true);
      }
      if (r.house === house) mine.push(r);
      else other.push(r);
    }

    setYourHousemates(mine);
    setOthers(other);
  };

  const toggleHide = async () => {
    if (!userUid) return;
    const newStatus = !hideMe;
    const { error } = await supabase
      .from('residents')
      .update({ hidden: newStatus })
      .eq('uid', userUid);
    if (!error) {
      setHideMe(newStatus);
      loadUserData();
    }
  };

  const togglePublicProfile = async () => {
    if (!userUid) return;
    const newStatus = !showProfile;
    const { error } = await supabase
      .from('residents')
      .update({ public_profile: newStatus })
      .eq('uid', userUid);
    if (!error) {
      setShowProfile(newStatus);
      loadUserData();
    }
  };

  const renderResident = (r: Resident, isYou = false) => (
    <View style={[
      styles.card,
      isYou && styles.meCard,
      isDark && { backgroundColor: '#232825', borderColor: isYou ? accent : '#232825' },
    ]}>
      <Text style={[styles.name, isDark && { color: '#E6F5DE' }]}>
        {r.name} {isYou ? '(You)' : ''}
      </Text>
      <Text style={[styles.meta, isDark && { color: '#B4CBA5' }]}>
        {new Date(r.arrival).toLocaleDateString()} →{' '}
        {new Date(r.departure).toLocaleDateString()}
      </Text>
      {r.public_profile && !isYou && (
        <>
          {r.country && <Text style={[styles.meta, isDark && { color: '#B4CBA5' }]}>🌍 {r.country}</Text>}
          {r.age && <Text style={[styles.meta, isDark && { color: '#B4CBA5' }]}>🎂 Age {r.age}</Text>}
        </>
      )}
    </View>
  );

  useEffect(() => {
    loadUserData();
  }, []);

  const handleNext = async () => {
    // await AsyncStorage.setItem('@findoors:welcome_done', 'true');
    router.push('/welcome/permissions');
  };

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: '#181c1b' }]}> 
      <Text style={[styles.header, isDark && { color: '#E6F5DE' }]}>Fellow Residents</Text>

      {yourHousemates.length > 0 && (
        <>
          <Text style={[styles.sectionHeader, isDark && { color: '#E6F5DE' }]}>🏠 Your Housemates</Text>
          <FlatList
            data={yourHousemates}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => renderResident(item, item.uid === userUid)}
          />
        </>
      )}

      {others.length > 0 && (
        <>
          <Text style={[styles.sectionHeader, isDark && { color: '#E6F5DE' }]}>🌐 Other Residents</Text>
          <FlatList
            data={others}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => renderResident(item)}
          />
        </>
      )}

      {/*}
      <View style={styles.switchRow}>
        <Text style={styles.meta}>Hide me from others</Text>
        <Switch value={hideMe} onValueChange={toggleHide} />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.meta}>Show my name, country & age</Text>
        <Switch value={showProfile} onValueChange={togglePublicProfile} />
      </View>
      */}
      <TouchableOpacity style={[styles.button, isDark && { backgroundColor: accent }]} onPress={handleNext}> 
        <Text style={styles.buttonText}>Continue →</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pastelGreen,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: '800',
    color: mainText,
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A685C',
    marginTop: 18,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  meCard: {
    borderColor: accent,
    borderWidth: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: mainText,
  },
  meta: {
    fontSize: 14,
    color: '#6B7B78',
    marginTop: 4,
  },
  switchRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    marginTop: 30,
    backgroundColor: accent,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});