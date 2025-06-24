import { supabase } from '@/lib/supabase';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme
} from 'react-native';


type WantToVisit = {
  id: string;
  uid: string;
  thingy_id: string[];
  created_at: string;
};

function useSavedLocations() {
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 1) current user
        const { data: auth, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        const user = auth?.user;
        if (!user) throw new Error('Not signed in');

        // 2) try to grab their want_to_visit row, but don't error if it doesn't exist
        const { data: wtv, error: wtvErr } = await supabase
          .from<WantToVisit>('want_to_visit')
          .select('thingy_id')
          .eq('uid', user.id)
          .maybeSingle();

        if (wtvErr) throw wtvErr;

        // 3) if there's no row, insert one and return empty
        if (!wtv) {
          const { error: insertErr } = await supabase
            .from('want_to_visit')
            .insert({ uid: user.id, thingy_id: [] });
          if (insertErr) throw insertErr;
          if (active) {
            setPois([]);
            setLoading(false);
          }
          return;
        }

        // 4) no saved POIs?
        if (!wtv.thingy_id?.length) {
          if (active) {
            setPois([]);
            setLoading(false);
          }
          return;
        }

        // 5) fetch POI details
        const uniqueIds = Array.from(new Set(wtv.thingy_id));
        const { data: poiRows, error: poiErr } = await supabase
          .from<POI>('poi')
          .select('id, title, image_url')
          .in('id', uniqueIds);
        if (poiErr) throw poiErr;

        if (active) {
          setPois(poiRows || []);
          setLoading(false);
        }
      } catch (err: any) {
        console.error(err);
        if (active) {
          setError(err.message || 'Unknown error');
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return { pois, loading, error };
}

export default function SavedLocationsScreen() {
  const isDark = useColorScheme() === 'dark';
  const { pois, loading, error } = useSavedLocations();

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#181C1B' : '#f5f5f5' }]}>
      <Stack.Screen options={{
        title: 'Saved Locations',
        headerStyle: { backgroundColor: isDark ? '#181C1B' : '#f5f5f5' },
          headerTitleStyle: { color: isDark ? '#fff' : '#000' },
          headerShadowVisible: false,
      }} />

      {loading && <ActivityIndicator size="large" color="#888" />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && !error && pois.length === 0 && (
        <Text style={styles.empty}>You haven’t saved any places yet.</Text>
      )}

      {!loading &&
        !error &&
        pois.map((poi) => (
          <View
            key={poi.id}
            style={[styles.card, { backgroundColor: isDark ? '#2e3332' : '#fff' }]}
          >
            <Text style={[styles.title, { color: isDark ? '#fff' : '#333' }]}>{poi.title}</Text>
            {poi.image_url && (
              <Image
                source={{ uri: poi.image_url }}
                style={styles.image}
              />
            )}
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    paddingBottom: 60,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 20,
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 20,
  },
  card: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 16,
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
});