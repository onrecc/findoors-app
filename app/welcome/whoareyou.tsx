import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

const pastelGreen = '#E6F5DE';
const mainText = '#5C7C6E';
const accent = '#F4A261';

export default function UserInfoScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [age, setAge] = useState('');
  const [eulaAccepted, setEulaAccepted] = useState(false);

  const handleSubmit = async () => {
    if (!name) {
      Alert.alert('Missing name', 'Please fill out your name.');
      return;
    }

    if (!eulaAccepted) {
      Alert.alert('EULA Required', 'Please accept the End User License Agreement to continue.');
      return;
    }

    let parsedAge;

    if (age) {
      parsedAge = parseInt(age);
      if (isNaN(parsedAge) || parsedAge <= 0) {
        Alert.alert('Invalid age', 'Please enter a valid number.');
        return;
      }
    }

    const { data: session } = await supabase.auth.getSession();
    const user = session?.session?.user;

    if (!user) {
      Alert.alert('Auth error', 'User not logged in.');
      return;
    }

    const { error } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      name,
      country: country || null,
      age: parsedAge || null,
      role: 'user',
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      await AsyncStorage.setItem('@findoors:name', name);
      router.push('/welcome/where');
    }
  };

  const isDark = useColorScheme() === 'dark';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, isDark && { backgroundColor: '#181C1B' }]}
    >
      <Text style={[styles.title, isDark && { color: '#E6F5DE' }]}>
        Let’s get to know you ✨
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && { color: '#9eaaa5' }]}>Your Name</Text>
        <TextInput
          autoCapitalize="words"
          maxLength={35}
          placeholder="e.g. Rene"
          placeholderTextColor={'#999'}
          style={[styles.input, isDark && { backgroundColor: '#2C2F2E', color: '#E6F5DE' }]}
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && { color: '#9eaaa5' }]}>Country (or state) <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput
          autoCapitalize="words"
          maxLength={24}
          placeholder="e.g. Finland or California, USA"
          placeholderTextColor={'#999'}
          style={[styles.input, isDark && { backgroundColor: '#2C2F2E', color: '#E6F5DE' }]}
          value={country}
          onChangeText={setCountry}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, isDark && { color: '#9eaaa5' }]}>Age <Text style={styles.optional}>(optional)</Text></Text> 
        <TextInput
          maxLength={2}
          placeholder="e.g. 17"
          keyboardType="numeric"
          placeholderTextColor={'#999'}
          style={[styles.input, isDark && { backgroundColor: '#2C2F2E', color: '#E6F5DE' }]}
          value={age}
          onChangeText={setAge}
        />
      </View>

      <View style={styles.eulaContainer}>
        <TouchableOpacity 
          style={styles.checkboxContainer}
          onPress={() => setEulaAccepted(!eulaAccepted)}
        >
          <View style={[styles.checkbox, isDark && { backgroundColor: '#181c1b', borderColor: '#3e4744' }, eulaAccepted && styles.checkboxChecked]}>
            {eulaAccepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I accept the{' '}
            <Text 
              style={styles.eulaLink}
              onPress={() => router.push('/welcome/EULA')}
            >
              End User License Agreement
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[
          styles.button, 
          (!eulaAccepted || !name) && styles.buttonDisabled
        ]} 
        onPress={handleSubmit}
        disabled={!eulaAccepted || !name}
      >
        <Text style={[
          styles.buttonText,
          !eulaAccepted && styles.buttonTextDisabled
        ]}>
          Continue →
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: pastelGreen,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: mainText,
    textAlign: 'center',
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 26,
  },
  label: {
    fontSize: 16,
    color: mainText,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  button: {
    marginTop: 40,
    backgroundColor: accent,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: accent,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowColor: '#ccc',
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonTextDisabled: {
    color: '#999',
  },
  optional: {
    fontSize: 12,
    color: mainText
  },
  eulaContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: mainText,
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: accent,
    borderColor: accent,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: mainText,
    lineHeight: 20,
  },
  eulaLink: {
    color: accent,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});