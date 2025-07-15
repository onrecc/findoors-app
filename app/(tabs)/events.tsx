import Loading from '@/components/loading';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme, Image } from 'react-native';
import { fetchLumaEvents, LumaEvent } from '@/lib/luma';

type EventTab = 'official' | 'luma';

const EventsScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<EventTab>('official');
  const [events, setEvents] = useState<any[]>([]);
  const [lumaEvents, setLumaEvents] = useState<LumaEvent[]>([]);
  const [loadingLuma, setLoadingLuma] = useState(true);
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = useColorScheme() === 'dark';

  const fetchAllEvents = async () => {
    setLoading(true);
    
    try {
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
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLumaData = async () => {
    setLoadingLuma(true);
    try {
      const events = await fetchLumaEvents();
      setLumaEvents(events);
    } catch (error) {
      console.error('Error fetching Lu.ma events:', error);
    } finally {
      setLoadingLuma(false);
    }
  };

  useEffect(() => {
    fetchAllEvents();
  }, []);

  useEffect(() => {
    if (activeTab === 'luma') {
      fetchLumaData();
    }
  }, [activeTab]);

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'official':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Official Events</Text>
            {events
              .filter(event => new Date(event.end_time) > new Date())
              .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
              .map(event => (
                <Pressable
                  key={event.id}
                  style={[styles.card, {backgroundColor: isDark ? '#262626' : '#fff'}]}
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
                  {event.description && (
                    <Text style={[styles.desc, { color: isDark ? '#e5e5e5' : '#262626' }]}>
                      {renderTextWithLinks(event.description)}
                    </Text>
                  )}
                </Pressable>
              ))}
            <Text style={[styles.sectionTitle, styles.sectionSpacing, isDark && styles.darkText]}>
              Shared Events
            </Text>
            {shares
              .filter(share => new Date(share.end + 'Z') > new Date())
              .map(share => (
                <Pressable
                  key={share.id}
                  style={[styles.card, {backgroundColor: isDark ? '#262626' : '#fff'}]}
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
          </View>
        );
      case 'luma':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Lu.ma Events</Text>
            {loadingLuma ? (
              <View style={styles.loadingContainer}>
                <Loading />
              </View>
            ) : lumaEvents.length === 0 ? (
              <Text style={[styles.emptyText, isDark && styles.darkText]}>
                No Lu.ma events available at the moment.
              </Text>
            ) : (
              lumaEvents.map(event => (
                <Pressable
                  key={event.id}
                  style={[styles.card, { backgroundColor: isDark ? '#262626' : '#fff' }]}
                  onPress={() => Linking.openURL(event.url)}
                >
                  {event.cover_url ? (
                    <Image
                      source={{ uri: event.cover_url }}
                      style={styles.eventImage}
                      resizeMode="cover"
                    />
                  ) : null}
                  <View style={styles.eventContent}>
                    <Text style={[styles.name, { color: isDark ? '#e5e5e5' : '#262626' }]}>{event.name}</Text>
                    <View style={styles.organizerContainer}>
                      {event.organizer.avatar_url && (
                        <Image
                          source={{ uri: event.organizer.avatar_url }}
                          style={styles.avatar}
                        />
                      )}
                      <Text style={[styles.organizer, { color: isDark ? '#a0a0a0' : '#666' }]}>
                        {event.organizer.name}
                      </Text>
                    </View>
                    <Text style={[styles.time, { marginTop: 4 }]}>
                      {new Date(event.start_date).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    {event.location?.name && (
                      <View style={styles.locationContainer}>
                        <MaterialIcons
                          name="location-on"
                          size={16}
                          color={isDark ? '#a0a0a0' : '#666'}
                        />
                        <Text style={[styles.location, { color: isDark ? '#a0a0a0' : '#666' }]}>
                          {event.location.name}
                        </Text>
                      </View>
                    )}
                    {event.price && (
                      <Text style={[styles.price, { color: isDark ? '#4CAF50' : '#2E7D32' }]}>
                        {event.price.display}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))
            )}
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <Stack.Screen
        options={{
          title: 'Events & Shares',
          headerShown: true,
          headerStyle: { backgroundColor: isDark ? '#121212' : '#fff' },
          headerTitleStyle: { fontWeight: 'bold' },
          headerTintColor: isDark ? '#fff' : '#333',
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
      
      <View style={[styles.tabContainer, isDark && styles.darkTabContainer]}>
        <Pressable
          style={({ pressed }) => [
            styles.tab,
            activeTab === 'official' && styles.activeTab,
            isDark && styles.darkTab,
            pressed && { opacity: 0.8 }
          ]}
          onPress={() => setActiveTab('official')}
        >
          <Text style={[
            styles.tabText,
            isDark && styles.darkTabText,
            activeTab === 'official' && styles.activeTabText,
            activeTab === 'official' && isDark && styles.darkActiveTabText
          ]}>
            All Events
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.tab,
            activeTab === 'luma' && styles.activeTab,
            isDark && styles.darkTab,
            pressed && { opacity: 0.8 }
          ]}
          onPress={() => setActiveTab('luma')}
        >
          <Text style={[
            styles.tabText,
            isDark && styles.darkTabText,
            activeTab === 'luma' && styles.activeTabText,
            activeTab === 'luma' && isDark && styles.darkActiveTabText
          ]}>
            Lu.ma
          </Text>
        </Pressable>
      </View>
      <ScrollView style={styles.scrollView}>
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

export default EventsScreen;

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  eventContent: {
    padding: 15,
  },
  organizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  organizer: {
    fontSize: 13,
    color: '#666',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  location: {
    fontSize: 13,
    marginLeft: 4,
  },
  price: {
    marginTop: 8,
    fontWeight: '600',
    fontSize: 15,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  darkTabContainer: {
    backgroundColor: '#121212',
    borderBottomColor: '#2d2d2d',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  darkTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '500',
  },
  darkTabText: {
    color: '#98989f',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  darkActiveTabText: {
    color: '#64b5f6',
  },
  tabContent: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#8e8e93',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '500',
    marginBottom: 20,
    color: '#333',
  },
  sectionSpacing: {
    marginTop: 20,
  },
  darkText: {
    color: '#e5e5e5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  card: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 15, 
    elevation: 3 
  },
  name: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 5, 
    color: '#222' 
  },
  time: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 10 
  },
  desc: { 
    fontSize: 16, 
    color: '#333' 
  },
  link: { 
    color: '#007AFF', 
    textDecorationLine: 'underline' 
  },
});