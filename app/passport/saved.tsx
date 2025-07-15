import { supabase } from '@/lib/supabase';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View
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
  const { pois, loading, error } = useSavedLocations();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const style = isDark ? darkStyles : styles;

  return (
    <ScrollView style={style.container}>
      <Stack.Screen options={{ 
        title: 'Saved Locations',
        headerStyle: {
          backgroundColor: isDark ? '#1a1a1a' : '#fff',
        },
        headerTintColor: isDark ? '#fff' : '#000',
      }} />

      {loading && <ActivityIndicator size="large" color={isDark ? '#888' : '#000'} />}
      {error && <Text style={style.error}>{error}</Text>}
      {!loading && !error && pois.length === 0 && (
        <Text style={style.empty}>You haven't saved any places yet.</Text>
      )}

      {!loading &&
        !error &&
        pois.map((poi) => (
          <View
            key={poi.id}
            style={style.card}
          >
            <Text style={style.title}>{poi.title}</Text>
            {poi.image_url && (
              <Image
                source={{ uri: poi.image_url }}
                style={style.image}
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
    color: '#333',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#121212',
    paddingBottom: 60,
  },
  error: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginVertical: 20,
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 20,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#fff',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 4,
    marginTop: 8,
  },
});