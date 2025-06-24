import { supabase } from '@/lib/supabase';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import MapboxGL from '@rnmapbox/maps';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';

const isDark = useColorScheme() === 'dark';
const MAP_STYLE = isDark ? 'https://api.maptiler.com/maps/basic-v2-dark/style.json?key=XSJRg4GXeLgDiZ98hfVp' : 'https://api.maptiler.com/maps/019717fd-a8fc-78fa-afaf-c660bbb6b406/style.json?key=XSJRg4GXeLgDiZ98hfVp';
const START_COORD: [number, number] = [-122.401297, 37.773972];
const houses = [
  { id: 1, lat: 37.7626, lon: -122.4172 },
  { id: 2, lat: 37.7705, lon: -122.4456 },
  { id: 3, lat: 37.7486, lon: -122.4869 },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [email, setEmail] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');

  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    let theta = 0;
    const radius = 0.003;
    const interval = setInterval(() => {
      theta += 0.015;
      const lon = START_COORD[0] + Math.cos(theta) * radius;
      const lat = START_COORD[1] + Math.sin(theta) * radius;
      cameraRef.current?.setCamera({ centerCoordinate: [lon, lat], animationDuration: 12000 });
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleEmailLogin = async () => {
    if (!email) return Alert.alert('Please enter a valid email address.');

    if (email === 'testmail') {
      const { error } = supabase.auth.signInWithPassword({
        email: 'kala@test.com',
        password: 'salsasana'
      })

      if (!error) {
        router.replace('/welcome/whoareyou');
        return;
      }
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      Alert.alert('Login error', error.message);
    } else {
      setShowOtpInput(true);
      Alert.alert('Success', 'A one-time code has been sent to your email.');
    }
  };

  const handleOtpLogin = async () => {
    if (!email || !otp) return Alert.alert('Please enter your email and the code you received.');

    const { error: otpError } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (otpError) return Alert.alert('OTP Error', otpError.message);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return Alert.alert('Authentication Error', 'Could not retrieve user information');
    }

    const { error } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      role: 'user',
    });

    const { data: existing, error: selErr } = await supabase
      .from('friend_code')
      .select('code')
      .eq('user_id', user.id)
      .limit(1);

    console.log(selErr)
    if (selErr) return Alert.alert('Database error', selErr.message);

    if (existing.length > 0) {
      router.replace('/');
    } else {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error: insErr } = await supabase.from('friend_code').insert({ user_id: user.id, code: newCode });
      if (insErr) return Alert.alert('Database Error', insErr.message);
      console.log('New friend code created:', newCode);
      router.replace('/welcome/whoareyou');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#181C1B' : '#fff' }]}>
      <MapboxGL.MapView
        style={[StyleSheet.absoluteFill, styles.mapFaint, { opacity: isDark ? 0.1 : 0.3 }]}
        styleURL={MAP_STYLE}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <MapboxGL.Camera ref={cameraRef} centerCoordinate={START_COORD} zoomLevel={10} />
        {houses.map(h => (
          <MapboxGL.MarkerView key={h.id} coordinate={[h.lon, h.lat]} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.houseMarker}>
              <Text style={{ fontSize: 15 }}>🏠</Text>
            </View>
          </MapboxGL.MarkerView>
        ))}
      </MapboxGL.MapView>

      <View style={styles.overlay}>
        <Text style={[styles.title, { color: isDark ? '#e1e6e4' : '#5C7C6E'}]}>Welcome to OtaMapSF</Text>
        <Text style={styles.subtitle}>Your Bay Area adventure starts now</Text>
        <Text style={styles.leaf}>🏠</Text>
      </View>

      <TouchableOpacity style={[styles.button, { backgroundColor: isDark ? '#ff8904' : '#F4A261' }]} onPress={() => bottomSheetRef.current?.snapToIndex(0)}>
        <Text style={styles.buttonText}>Get Started!</Text>
      </TouchableOpacity>

      <BottomSheet
        index={-1}
        snapPoints={['92%']}
        enablePanDownToClose
        ref={bottomSheetRef}
        backgroundStyle={[styles.sheetBackground, { backgroundColor: isDark ? '#1E2624' : '#F0F8E8', borderColor: isDark ? '#3A4B48' : '#B4CBA5' }]}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetView} keyboardShouldPersistTaps="handled">
          <Text style={styles.emoji}>🏠</Text>
          <Text style={[styles.sheetText, { color: isDark ? '#E1EDD6' : '#5C7C6E', textShadowColor: isDark ? '#3A4B48' : '#E1EDD6' }]}>
            Login to OtaMapSF
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#2A3431' : '#FAFDF7', color: isDark ? '#E1EDD6' : '#546C5E', borderColor: isDark ? '#3A4B48' : '#B4CBA5' }]}
            placeholder="Your email address"
            placeholderTextColor={ isDark ? '#B4CBA5' : '#B4CBA5' }
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity
            style={[styles.sheetButton, { backgroundColor: isDark ? '#ff8904' : '#F4A261', borderColor: isDark ? '#3A4B48' : '#82A57A' }]}
            onPress={handleEmailLogin}
          >
            <Text style={[styles.sheetButtonText, { color: isDark ? '#E1EDD6' : '#FFF', fontWeight: '700' }]}>
              Send OTP Code
            </Text>
          </TouchableOpacity>

          {showOtpInput && (
            <View style={styles.otpSection}>
              <Text style={styles.sheetTextSm}>Enter the code from your email:</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#2A3431' : '#FAFDF7', color: isDark ? '#E1EDD6' : '#546C5E', borderColor: isDark ? '#3A4B48' : '#B4CBA5' }]}
                placeholder="One-Time Password"
                placeholderTextColor="#B4CBA5"
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                value={otp}
                onChangeText={setOtp}
                returnKeyType="done"
                onSubmitEditing={() => {
                  handleOtpLogin();
                  Keyboard.dismiss();
                }}
              />
              <TouchableOpacity style={[styles.sheetButton, { backgroundColor: isDark ? '#ff8904' : '#F4A261', borderColor: isDark ? '#3A4B48' : '#82A57A' }]} onPress={handleOtpLogin}>
                <Text style={[styles.sheetButtonText, { color: isDark ? '#E1EDD6' : '#FFF', fontWeight: '700' }]}>Log in with Code</Text>
              </TouchableOpacity>
              <Text style={styles.otpHint}>(Check your spam folder if you don't see it.)</Text>
            </View>
          )}
          <View style={{ height: 200, }}/>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapFaint: { opacity: 0.3 },
  houseMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F4A261',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: { fontSize: 36, fontWeight: '900', color: '#5C7C6E', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 18, color: '#7A8D7B', textAlign: 'center', marginBottom: 30 },
  leaf: { fontSize: 64, marginVertical: 20 },
  button: {
    position: 'absolute',
    bottom: 40,
    left: '10%',
    right: '10%',
    backgroundColor: '#F4A261',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  sheetBackground: {
    backgroundColor: '#F0F8E8',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 3,
    borderColor: '#B4CBA5',
    shadowColor: '#7A8D7B',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 10,
  },
  sheetView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 98,
  },
  emoji: { fontSize: 48, marginBottom: 6 },
  sheetText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#5C7C6E',
    marginBottom: 18,
    letterSpacing: 1,
    textShadowColor: '#E1EDD6',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 2,
    textAlign: 'center',
  },
  input: {
    width: '83%',
    height: 54,
    borderColor: '#B4CBA5',
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    color: '#546C5E',
    backgroundColor: '#FAFDF7',
    marginTop: 16,
    shadowColor: '#B4CBA5',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sheetButton: {
    marginTop: 28,
    width: 210,
    backgroundColor: '#F4A261',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#F4A261',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#82A57A',
  },
  sheetButtonText: { color: '#FFF', fontSize: 19, fontWeight: '700', letterSpacing: 0.7 },
  otpSection: { marginTop: 20, width: '100%', alignItems: 'center' },
  sheetTextSm: { fontSize: 17, color: '#5C7C6E', marginBottom: 8, fontWeight: '700', textAlign: 'center', letterSpacing: 0.5 },
  otpHint: { fontSize: 13, color: '#B4CBA5', marginTop: 10, textAlign: 'center', fontStyle: 'italic' },
});