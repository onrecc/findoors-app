import FriendModal, { FriendModalMethods } from '@/components/modal/friendModalSheet';
import POIModal, { POIModalMethods } from '@/components/modal/poiModal';
import ShareLocationModal, {
  ShareLocationModalMethods,
} from '@/components/modal/shareLocationModal';
import { useAchievements } from '@/lib/AchievementContext';
import { startBackgroundLocation, stopBackgroundLocation } from '@/lib/bg/backgroundLocation';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import MapBox, { Camera, MapView, MarkerView, UserLocation } from '@rnmapbox/maps';
import * as turf from '@turf/turf';
import * as Location from 'expo-location';
import { useFocusEffect, useGlobalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Modal, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

interface POI {
  id: string;
  lat: number;
  lon: number;
  title: string;
  icon_url: string;
  type: string;
}

interface LocationShare {
  id: string;
  start: string;
  sharer_id: string;
  durationh: number;
  note: string | null;
  isPrecise: boolean;
  lat: number;
  lon: number;
  radius: number;
  shared_to: string[];
  user_name: string | null;
}

const SFHomeScreen = () => {
  const router = useRouter();
  const [pois, setPois] = useState<POI[]>([]);
  const [locationShares, setLocationShares] = useState<LocationShare[]>([]);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const poiModalRef = useRef<POIModalMethods>(null);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [selectedShare, setSelectedShare] = useState<LocationShare | null>(null);
  const shareModalRef = useRef<ShareLocationModalMethods>(null);
  const filterModalRef = useRef<ShareLocationModalMethods>(null);
  const friendModalRef = useRef<FriendModalMethods>(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const cameraRef = useRef<Camera>(null);
  const { poi: poiId } = useGlobalSearchParams<{ poi?: string }>();
  const [shareRowId, setShareRowId] = useState<string | null>(null);
  const [showStopModal, setShowStopModal] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const {unlockAchievement} = useAchievements();
  const activeShares = locationShares.filter(share => {
    const expiry = new Date(share.start).getTime() + share.durationh * 3600 * 1000;
    return expiry > Date.now();
  });
  const isDark = useColorScheme() === 'dark';

  useFocusEffect(
    React.useCallback(() => {
      if (!mapReady || !poiId || pois.length === 0) return;
      const target = pois.find(p => p.id === poiId);
      if (target) {
        cameraRef.current?.flyTo([target.lon, target.lat], 1000);
        setSelectedPoi(target);
        poiModalRef.current?.present();

        // clear the query-param so on refresh it won't trigger again
        router.replace('/'); 
      }
    }, [mapReady, poiId, pois])
  );
  /*
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/welcome');
      }
    });
  }, []);
  */
  useEffect(() => {
    console.log('POI ID from params:', poiId);
    if (!poiId || pois.length === 0) return;

    const targetPoi = pois.find(p => p.id === poiId);
    console.log(`Trying to center on POI "${poiId}". Found:`, !!targetPoi);
    // poi lat lon
    console.log('Target POI coordinates:', targetPoi ? `(${targetPoi.lon}, ${targetPoi.lat})` : 'Not found');

    if (targetPoi) {
      cameraRef.current?.flyTo([targetPoi.lon, targetPoi.lat], 1000);
      setSelectedPoi(pois.find(p => p.id === poiId) || null);
      poiModalRef.current?.present();
    }
  }, [poiId, pois]);

  const blinkAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!shareRowId) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shareRowId]);

  const handleStopShare = async () => {
    await stopBackgroundLocation();
    setShareRowId(null);
    setShowStopModal(false);
    alert('Location sharing stopped');
    fetchData();
  };

  const fetchData = async () => {
    const { data: poiData, error: poiError } = await supabase.from('poi').select('*');
    if (poiError) {
      console.error('Error fetching POIs:', poiError.message);
      setPois([]);
    } else {
      setPois(poiData as POI[] || []);
    }

    const { data: shareData, error: shareError } = await supabase.from('user_events').select('*');
    if (shareError) {
      console.error('Error fetching shares:', shareError.message);
      setUserEvents([]);
    } else {
      setUserEvents(shareData || []);
    }

    const { data: locationShareData, error: LSError } = await supabase.from("location_share").select('*');
    if (LSError) {
      console.error('Error fetching locations:', LSError.message)
      setLocationShares([])
    } else {
      console.log('Fetched location shares:', locationShareData);
      setLocationShares(locationShareData)
    }
  };

  useEffect(() => {
    fetchData();

    const checkLocationWithinSF = async () => {
      try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      
      const sfPoint = [-122.4194, 37.7749]; 
      const userPoint = [location.coords.longitude, location.coords.latitude];
      
      const options = { units: 'kilometers' };
      const distance = turf.distance(
        turf.point(sfPoint), 
        turf.point(userPoint),
        options
      );
      
      if (distance <= 50) {
        unlockAchievement('welcome_to_sf')
      } 
      } catch (error) {
      console.error('Error checking location:', error);
      }
    };
    
    checkLocationWithinSF();

    // Set up subscription for location changes
  }, []);

  const openPoiModal = (poi: POI) => {
    cameraRef.current?.flyTo([poi.lon, poi.lat], 250);
    setSelectedPoi(poi);
    poiModalRef.current?.present();
  };

  const openFriendModal = (share: LocationShare) => {
    setSelectedShare(share);
    friendModalRef.current?.present();
  };

  const centerOnUser = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
    cameraRef.current?.moveTo([loc.coords.longitude, loc.coords.latitude], 1000);
  };

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    if (!shareRowId) return;  // nothing to update yet

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 10000, 
          distanceInterval: 5,
        },
        async loc => {
          // push the update 
          const { error } = await supabase
            .from('location_share')
            .update({
              lat:  loc.coords.latitude,
              lon:  loc.coords.longitude,
            })
            .eq('id', shareRowId);

          if (error) {
            console.error('Error updating location share:', error.message);
          } else {
            console.log('Location updated on server');
          }
        }
      );
    })();

    return () => {
      subscription?.remove();
    };
  }, [shareRowId]);

  const handleLocationShare = async (data: any) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      alert('Not logged in');
      return;
    }

    const { data: { user: userData }, error: userFetchError } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();

    const row = {
      start:     new Date().toISOString(),
      sharer_id: user.id,
      durationh: data.durationHours,
      note:      data.description,
      isPrecise: data.isPrecise,
      lat:       loc.coords.latitude,
      lon:       loc.coords.longitude,
      radius:    data.radiusMeters,
      shared_to: data.friendUserIds,
      user_name: userData?.name || null,
    };

    const insertRes = await supabase
      .from('location_share')
      .insert([row])
      .select('id')
      .single();

    if (insertRes.error || !insertRes.data?.id) {
      console.error('Error sharing location:', insertRes.error?.message);
      alert('Could not share location');
      return;
    }

    const newId = insertRes.data.id;
    alert('Location shared successfully!');
    setShareRowId(newId);

    try {
      await startBackgroundLocation(newId);
    } catch (err) {
      console.error('Background tracking failed:', err);
    }

    setTimeout(
      () => stopBackgroundLocation(),
      data.durationHours * 3600 * 1000
    );
    fetchData();
    setIsSelectingLocation(false);
    setSelectedLocation(null);
  };

  useEffect(() => {
    if (!selectedPoi) {
      return;
    }

    const channelName = `messages-poi-${selectedPoi.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thingy_id=eq.${selectedPoi.id}`,
        },
        payload => {
          setMessages(msgs => [...msgs, payload.new]);
        }
      );

    channel.subscribe((status, err) => {
      if (err) console.error('subscribe error', err);
      else console.log(`subscribed to ${channelName}`);
    });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [selectedPoi]);

  // request old messages when a POI is selected
  useEffect(() => {
    if (!selectedPoi) return;

    const fetchMessages = async () => { 
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thingy_id', selectedPoi.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching messages:', error.message);
      } else {
        console.log('Fetched messages for POI:', selectedPoi.id, data);
        setMessages(data || []);
      }
    };

    fetchMessages();
  }, [selectedPoi]);

  MapBox.setAccessToken(
    'sk.eyJ1Ijoib25yZWMiLCJhIjoiY21hcjk0dWJxMDljZjJpc2ZpNTBmYzJlaSJ9.g9Gtb_MLi1v916-lt7ZrWg'
  );

  return (
    <View style={styles.container}>
      <MapView
        style={{ flex: 1, width: '100%' }}
        styleURL={ isDark ? 'https://api.maptiler.com/maps/basic-v2-dark/style.json?key=XSJRg4GXeLgDiZ98hfVp' : "https://api.maptiler.com/maps/basic-v2/style.json?key=XSJRg4GXeLgDiZ98hfVp"}
        onDidFinishLoadingMap={() => setMapReady(true)}
        onPress={e => {
          if (isSelectingLocation && e.geometry?.coordinates) {
            setSelectedLocation(e.geometry.coordinates as [number, number]);
          }
        }}
      >
        <Camera
          ref={cameraRef}
          zoomLevel={12}
          centerCoordinate={[-122.4194, 37.7749]}
          animationMode="flyTo"
          animationDuration={1000}
        />
        <UserLocation visible androidRenderMode="normal" />

        {pois.map(poi => (
          <MarkerView
            key={poi.id}
            coordinate={[poi.lon, poi.lat]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Pressable onPress={() => openPoiModal(poi)} hitSlop={15}>
              <Image
                source={
                  poi.type === 'landmark'
                    ? require('@/assets/landmark64.png')
                    : poi.type === 'food'
                    ? require('@/assets/food64.png')
                    : poi.type === 'gem'
                    ? require('@/assets/gem64.png')
                    : poi.type === 'view'
                    ? require('@/assets/view64.png')
                    : poi.type === 'event'
                    ? require('@/assets/event64.png')
                    : undefined
                }
                style={{ width: 30, height: 30, borderRadius: 15 }}
              />
            </Pressable>
          </MarkerView>
        ))}

        {activeShares.map(share => {
          return (
            <MarkerView
            key={share.id}
            coordinate={[share.lon, share.lat]}
            anchor={{ x: 0.5, y: 0.5 }}
            >
              <Pressable onPress={() => {openFriendModal(share); 
              console.log("opened")
              console.log("Share data:", share)
            }}
              hitSlop={10}>
                <Image
                  source={{ uri: `https://ui-avatars.com/api/?name=${share.user_name || 'Anonymous'}&background=random&size=60` }}
                  style={{ width: 30, height: 30, borderRadius: 15 }}
                />
              </Pressable>
            </MarkerView>
          )
        })}

        {userEvents
          .filter(event => {
            const endTime = new Date(event.end + 'Z'); 
            return endTime > new Date();
          })
          .map(event => {
            return (
              <React.Fragment key={event.id}>
          <MarkerView
            coordinate={[event.lon, event.lat]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Pressable
              onPress={() => {
                setSelectedPoi({
                  id: event.id,
                  lat: event.lat,
                  lon: event.lon,
                  title: event.name,
                  icon_url: '',
                  type: 'uevent',
                });
                poiModalRef.current?.present();
              }}
              hitSlop={15}
            >
              <Image
                source={require('@/assets/share64.png')}
                style={{ width: 30, height: 30 }}
              />
            </Pressable>
          </MarkerView>
              </React.Fragment>
            );
          })}

        {isSelectingLocation && selectedLocation && (
          <MarkerView
            coordinate={selectedLocation}
            anchor={{ x: 0.5, y: 1 }}
          >
            <MaterialIcons name="location-on" size={32} color="red" />
          </MarkerView>
        )}
      </MapView>

      <View style={styles.mapButtonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.mapButton,
            { opacity: pressed ? 0.6 : 1, backgroundColor: isDark ? '#181C1B' : '#fff' },
          ]}
          onPress={centerOnUser}
        >
          <MaterialIcons name="my-location" size={28} color={ isDark ? '#e1e6e4' : '#404040' } />
        </Pressable>

        {shareRowId ? (
          <Pressable
            style={({ pressed }) => [
              styles.mapButton,
              { opacity: pressed ? 0.6 : 1, backgroundColor: isDark ? '#181C1B' : '#fff' },
            ]}
            onPress={() => setShowStopModal(true)}
          >
            <Animated.View style={{ opacity: blinkAnim }}>
              <MaterialIcons name="location-on" size={28} color="red" />
            </Animated.View>
          </Pressable>
        ) : (
          <Pressable
          style={({ pressed }) => [
            styles.mapButton,
            { opacity: pressed ? 0.6 : 1, backgroundColor: isDark ? '#181C1B' : '#fff'},
          ]}
          onPress={() => {
            setIsSelectingLocation(true);
            poiModalRef.current?.close();
            shareModalRef.current?.present();
          }}
        >
          <MaterialIcons name="share-location" size={28} color={ isDark ? '#e1e6e4' : '#404040' } />
        </Pressable>
        )}
      </View>

      <ShareLocationModal
        ref={shareModalRef}
        onSubmit={handleLocationShare}
        onClose={() => setIsSelectingLocation(false)}
        manualLocation={selectedLocation}
        setManualLocation={setSelectedLocation}
      />

      <POIModal
        ref={poiModalRef}
        initialSnap="mid"
        minHeight={200}
        midHeight={400}
        maxHeight={800}
        selectedPoiData={selectedPoi}
        messages={messages}
      />

      <FriendModal
        ref={friendModalRef}
        share={selectedShare}
        initialSnap="mid"
      />
      
      <Modal
        transparent
        visible={showStopModal}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Stop sharing your location?</Text>
            <View style={styles.modalButtons}>
              <Pressable onPress={() => setShowStopModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleStopShare}>
                <Text style={styles.modalConfirm}>Stop</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SFHomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapButtonContainer: {
    position: 'absolute',
    top: 50,
    right: 15,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  mapButton: {
    // backgroundColor: 'white',
    padding: 12,
    borderRadius: 16,
  },
  trackingIndicator: {
    position: 'absolute',
    bottom: 80,
    right: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalCancel: {
    fontSize: 16,
    color: 'gray',
  },
  modalConfirm: {
    fontSize: 16,
    color: 'red',
  },
});