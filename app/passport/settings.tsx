import { supabase } from '@/lib/supabase';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity, useColorScheme, View
} from 'react-native';

const SettingsScreen = () => {
  const [name, setName] = useState('Loading...');
  const [country, setCountry] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id;

      if (!uid) {
        setLoading(false);
        return;
      }

      console.log('Fetching user data for UID:', uid);

      const { data: user, error } = await supabase
        .from('users')
        .select('name, country, age')
        .eq('id', uid)
        .single();

      if (!error && user) {
        setName(user.name || '');
        setCountry(user.country || '');
        setAge(user.age ?? null);
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const updateInformation = async (name: string, country: string, age: number | null) => {
    if (!name || !country || age === null) {
      alert('Please fill in all fields.');
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user.id;

    console.log('Updating user information:', { name, country, age });
    const { data, error } = await supabase
      .from('users')
      .update({ name, country, age })
      .eq('id', uid);
    if (error) {
      console.error('Error updating user information:', error);
      alert('Failed to update information. Please try again.');
      return;
    }
    console.log('User information updated:', data);
    alert('Information updated successfully!');
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#181C1B' : '#f5f5f5' }]}>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerStyle: { backgroundColor: isDark ? '#181C1B' : '#fff' },
          headerTitleStyle: { color: isDark ? '#fff' : '#000' },
          headerTintColor: isDark ? '#fff' : '#000',  
          headerShadowVisible: false,
        }}
      />

      {/* Personal Info */}
      <Text style={[styles.sectionTitle, { color: isDark ? '#e5e5e5' : '#333'}]}>My Information</Text>
      <View style={styles.card}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: isDark ? '#737373' : '#555' }]}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={[styles.input, { backgroundColor: isDark ? '#2e3332' : '#f8f8f8', borderColor: isDark ? '#3e4744' : '#D1D5DB', color: isDark ? '#e5e5e5' : '#333' }]}
            placeholderTextColor={'#999'}
            placeholder="Enter your name"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: isDark ? '#737373' : '#555' }]}>Country</Text>
          <TextInput
            value={country}
            onChangeText={setCountry}
            style={[styles.input, { backgroundColor: isDark ? '#2e3332' : '#f8f8f8', borderColor: isDark ? '#3e4744' : '#D1D5DB', color: isDark ? '#e5e5e5' : '#333' }]}
            placeholderTextColor={'#999'}
            placeholder="Enter your country"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: isDark ? '#737373' : '#555' }]}>Age</Text>
          <TextInput
            value={age !== null ? String(age) : ''}
            onChangeText={(t) => setAge(t ? parseInt(t, 10) : null)}
            style={[styles.input, { backgroundColor: isDark ? '#2e3332' : '#f8f8f8', borderColor: isDark ? '#3e4744' : '#D1D5DB', color: isDark ? '#e5e5e5' : '#333' }]}
            placeholderTextColor={'#999'}
            placeholder="Enter your age"
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={[styles.linkButton, { backgroundColor: isDark ? '#ff8904' : '#F4A261' }]}
          onPress={() => updateInformation(name, country, age)}
        >
          <Text style={styles.linkText}>Update your information</Text>
        </TouchableOpacity>
      </View>

      {/*}
      <Text style={styles.sectionTitle}>Preferences</Text> 
      <View style={styles.linksContainer}>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/passport/settings/change-house')}
        >
          <Text style={styles.linkText}>Change House</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/passport/settings/change-stay-length')}
        >
          <Text style={styles.linkText}>Change Stay Length</Text>
        </TouchableOpacity>
      </View>
      */}
      <View style={styles.linksContainerDestructive}>
        <TouchableOpacity
          style={styles.linkButtonDestructive}
          onPress={() => Linking.openURL('https://sf.otamaps.fi/remove-my-account')}
        >
          <Text style={styles.linkText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F0F2F5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    // backgroundColor: '#fff',
    // marginHorizontal: 16,
    borderRadius: 8,
    padding: 16,
    // iOS shadow
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // Android elevation
    elevation: 3,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  linksContainer: {
    marginHorizontal: 16,
    // marginBottom: 32,
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    gap: 6
  },
  linksContainerDestructive: {
    marginHorizontal: 16,
    // marginBottom: 32,
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    gap: 6,
    position: 'absolute',
    bottom: -300,
  },
  linkButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24
    // width: '45%'
  },
  linkButtonDestructive: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    width: '91.5%',
    position: 'absolute',
    bottom: 16,
  },
  linkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});