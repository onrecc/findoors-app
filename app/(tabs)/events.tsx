import Loading from '@/components/loading';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';

const EventsScreen = () => {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    const fetchData = async () => {
      // Fetch official events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });
      if (eventsError) console.error(eventsError);
      else setEvents(eventsData || []);

      // Fetch user-shared events
      const nowIso = new Date().toISOString();
      const { data: sharesData, error: sharesError } = await supabase
        .from('user_events')
        .select('*')
        .gt('end', nowIso)
        .order('start', { ascending: true });
      if (sharesError) console.error(sharesError);
      else setShares(sharesData || []);

      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <Loading />;

  const renderTextWithLinks = (text: string) =>
    text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
      /(https?:\/\/[^\s]+)/.test(part) ? (
        <Text
          key={i}
          style={styles.link}
          onPress={() => Linking.openURL(part).catch(console.error)}
        >
          {part}
        </Text>
      ) : (
        part
      )
    );

  // Navigate to POI-based map popup
  const goToMapById = (poiId: string | null) => {
    if (!poiId) return; // guard: do nothing if no poi id
    router.replace(`/?poi=${poiId}`);
  };

  // Optionally navigate by coordinates for shares
  const goToMapByCoords = (lat?: number, lon?: number) => {
    if (lat == null || lon == null) return;
    router.replace(`/?lat=${lat}&lon=${lon}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#181C1B' : '#f0f0f0' }}>
      <Stack.Screen
        options={{
          title: 'Events & Shares',
          headerShown: true,
          headerStyle: { backgroundColor: isDark ? '#181C1B' : '#fff' },
          headerTitleStyle: { fontWeight: 'bold' },
          headerTintColor: isDark ? '#fff' : '#333',
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/events/create')}
              style={{ marginRight: 15 }}
            >
              <MaterialIcons name="add" size={24} color={isDark ? '#fff' : "#333"} />
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={[styles.container, {backgroundColor: isDark ? '#181C1B' : '#f0f0f0'}]} style={{ paddingBottom: 40 }}>
        {/* Shares Section */}
        {shares.filter(share => new Date(share.end + 'Z') > new Date()).length > 0 && (
          <Text style={[styles.header, {color: isDark ? '#e5e5e5' : '#262626'}]}>Neighbors Shares</Text>
        )}
        {shares
          .filter(share => new Date(share.end + 'Z') > new Date())
          .map(share => (
            <Pressable
              key={share.id}
              style={[styles.card, {backgroundColor: isDark ? '#2e3332' : '#fff'}]}
              onPress={() => goToMapByCoords(share.lat, share.lon)}
            >
              <Text style={[styles.name, { color: isDark ? '#e5e5e5' : '#262626' }]}>{share.name}</Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Text style={[styles.time, { paddingRight: 8 }]}>                
                  {new Date(share.start + 'Z').toLocaleDateString([], {
                    day: 'numeric', month: 'long',
                  })}
                </Text>
                <Text style={styles.time}>
                  {new Date(share.start + 'Z').toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit', hour12: false,
                  })}
                </Text>
                <Text style={styles.time}>-</Text>
                <Text style={styles.time}>
                  {new Date(share.end + 'Z').toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit', hour12: false,
                  })}
                </Text>
              </View>
              {share.description && (
                <Text style={[styles.desc, { color: isDark ? '#e5e5e5' : '#262626' }]}>
                  {renderTextWithLinks(share.description)}
                </Text>
              )}
            </Pressable>
          ))}

        {/* Events Section */}
        <Text style={[styles.header, {color: isDark ? '#e5e5e5' : '#262626'}]}>Upcoming Events</Text>
        {events.filter(event => new Date(event.end_time) > new Date()).length > 0 ? (
          events
            .filter(event => new Date(event.end_time) > new Date())
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
            .map(event => (
            <Pressable
              key={event.id}
              style={[styles.card, {backgroundColor: isDark ? '#2e3332' : '#fff'}]}
              onPress={() => {
                goToMapById(event.poi_id);
              }}
            >
              <Text style={[styles.name, { color: isDark ? '#e5e5e5' : '#262626' }]}>{event.name}</Text>
              <Text style={styles.time}>
                {new Date(event.start_time).toLocaleString([], {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })} -{' '}
                {new Date(event.end_time).toLocaleString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </Text>
              {/* <Text style={styles.time}>{event.poi_id}</Text> */}
              {event.description && (
                <Text style={[styles.desc, { color: isDark ? '#e5e5e5' : '#262626' }]}>
                  {renderTextWithLinks(event.description)}
                </Text>
              )}
            </Pressable>
            ))
        ) : (
          <Text style={styles.no}>No events found.</Text>
        )}
      </ScrollView>
    </View>
  );
};

export default EventsScreen;

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 90 },
  header: { fontSize: 22, fontWeight: '500', marginBottom: 20, color: '#333' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 3 },
  name: { fontSize: 20, fontWeight: 'bold', marginBottom: 5, color: '#222' },
  time: { fontSize: 14, color: '#666', marginBottom: 10 },
  desc: { fontSize: 16, color: '#333' },
  link: { color: '#007AFF', textDecorationLine: 'underline' },
  no: { textAlign: 'center', fontSize: 18, color: '#888', paddingVertical: 80 },
});