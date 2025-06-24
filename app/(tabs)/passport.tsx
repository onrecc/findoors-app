import { useAchievements } from '@/lib/AchievementContext';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PassportScreen = () => {
  const [name, setName] = useState('Loading...');
  const [country, setCountry] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { unlockAchievement, achievements } = useAchievements();
  const isDark = useColorScheme() === 'dark';

  const style = isDark ? darkStyles : styles;

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id;

      if (!uid) {
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();

      console.log('User data:', user, 'Error:', error);

      if (!error && user) {
        setName(user.name || 'Unnamed');
        setCountry(user.country || '');
        setAge(user.age || null);
      }
    };

    fetchUserData();
  }, []);

  return (
    <SafeAreaView style={style.container}>
      {/* 📘 Passport Header */}
      <View style={style.passportHeader}>
        <View style={style.pfpBlock}>
          <Image
            source={{
              uri: `https://ui-avatars.com/api/?name=${name.charAt(0)}&background=random&size=256&bold=true`,
            }}
            style={style.pfp}
          />
          <View>
            <Text style={style.name}>{name}</Text>
            <Text style={style.country}>
              {country ? `🌍 ${country}` : '🌍 Unknown'}
              {age !== null ? ` · 🎂 ${age}` : ''}
            </Text>
          </View>
        </View>
        {/*<View style={styles.progressBlock}>
          <View style={styles.circle}>
            <Text style={styles.progressText}>75%</Text>
            <Text style={styles.label}>Explored</Text>
          </View>
        </View>*/}
      </View>

      {/* 🎒 Feature Buttons */}
      <View style={style.buttonList}>
        <Link href="/friends" asChild>
          <TouchableOpacity style={style.listButton}>
          <MaterialCommunityIcons name="home-group" size={32} color="#546C5E" />
          <Text style={style.listButtonText}>Friends & Neighbors</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/passport/badges" asChild>
          <TouchableOpacity style={style.listButton}>
          <MaterialCommunityIcons name="trophy-award" size={32} color="#546C5E" />
          <Text style={style.listButtonText}>Stamps</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/passport/checkins" asChild>
          <TouchableOpacity style={style.listButton}>
          <MaterialCommunityIcons name="map-marker-check" size={32} color="#546C5E" />
          <Text style={style.listButtonText}>Check-Ins</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/passport/saved" asChild>
          <TouchableOpacity style={style.listButton}>
          <MaterialIcons name="bookmark" size={32} color="#546C5E" />
          <Text style={style.listButtonText}>Saved Locations</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/passport/settings" asChild>
          <TouchableOpacity style={style.listButton}>
          <MaterialIcons name="settings" size={32} color="#546C5E" />
          <Text style={style.listButtonText}>Settings</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* 🔐 Auth Status / Login Link */}
      {!isLoggedIn && (
        <Link style={style.quote} href="/welcome">
          You're not logged in! Click me to login
        </Link>
      )}

      {isLoggedIn && (
        <TouchableOpacity
          style={style.quote}
          onPress={async () => {
            await supabase.auth.signOut();
            setIsLoggedIn(false);
            setName('Loading...');
            setCountry('');
            setAge(null);
            router.push('/welcome');
          }}
        >
          <Text style={style.logout}>Log Out</Text>
        </TouchableOpacity>

        // debug (buttons to go thru welcome flow)

      )}
    </SafeAreaView>
  );
};

export default PassportScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFDF7',
    alignItems: 'center',
    paddingTop: 20,
  },
  passportHeader: {
    // backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 7,
    borderRadius: 18,
    width: '90%',
    marginBottom: 30,
    elevation: 3,
    // shadowColor: '#000',
    // shadowOpacity: 0.04,
    // shadowRadius: 8,
  },
  pfpBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pfp: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eee',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#546C5E',
    marginBottom: 4,
  },
  country: {
    fontSize: 14,
    color: '#7A8D7B',
  },
  progressBlock: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E1EDD6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A685C',
  },
  label: {
    fontSize: 10,
    color: '#6B7B78',
  },
  buttonGrid: {
    width: '90%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  gridButton: {
    width: '47%',
    backgroundColor: '#F0F8E8',
    paddingVertical: 24,
    borderRadius: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#B4CBA5',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  quote: {
    marginTop: 40,
    fontStyle: 'italic',
    textDecorationLine: 'underline',
    color: '#8FA49C',
  },
  buttonList: {
    width: '90%',
    marginBottom: 20,
  },
  listButton: {
    backgroundColor: '#E6F3D8',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#B4CBA5',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    paddingHorizontal: 16,
  },
  listButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#546C5E',
    marginLeft: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#546C5E',
  },
  logout: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
  }
});

const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181C1B',
    alignItems: 'center',
    paddingTop: 20,
  },
  passportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 7,
    borderRadius: 18,
    width: '90%',
    marginBottom: 30,
    elevation: 3,
    // backgroundColor: '#232826',
  },
  pfpBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pfp: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#E6F3D8',
    marginBottom: 4,
  },
  country: {
    fontSize: 14,
    color: '#A3B9A7',
  },
  progressBlock: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2C3A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#B4CBA5',
  },
  label: {
    fontSize: 10,
    color: '#A3B9A7',
  },
  buttonGrid: {
    width: '90%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  gridButton: {
    width: '47%',
    backgroundColor: '#232826',
    paddingVertical: 24,
    borderRadius: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  quote: {
    marginTop: 40,
    fontStyle: 'italic',
    textDecorationLine: 'underline',
    color: '#A3B9A7',
  },
  buttonList: {
    width: '90%',
    marginBottom: 20,
  },
  listButton: {
    backgroundColor: '#232826',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    paddingHorizontal: 16,
  },
  listButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E6F3D8',
    marginLeft: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E6F3D8',
  },
  logout: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
  }
});
