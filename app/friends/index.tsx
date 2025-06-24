import Loading from '@/components/loading';
import { useAchievements } from '@/lib/AchievementContext';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';

interface Friend {
  age: number;
  country: string;
  name: string;
  email: string;
  id: string;
}

interface Neighbor {
  friend_id: string;
  id: string;
}

const NeighborsScreen = () => {
  const [neighbors, setNeighbors] = useState<Neighbor[]>([]);
  const [friendsData, setFriendsData] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { unlockAchievement } = useAchievements();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark' ? true : false;

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const fetchNeighbors = async () => {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*');
      if (error) {
        console.error('Error fetching neighbors:', error.message);
      } else {
        setNeighbors(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching neighbors:', error);
    }
  };

  useEffect(() => {
    fetchNeighbors();

    if (neighbors.length > 0) {
      unlockAchievement('new_neighbor')
    }
  }, []);

  useEffect(() => {
    const fetchFriendsData = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .in('id', neighbors.map(n => n.friend_id))
          .neq('id', currentUserId); 
        if (error) {
          console.error('Error fetching friends data:', error.message);
        } else {
          setFriendsData(data || []);
        }
      } catch (error) {
        console.error('Unexpected error fetching friends data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (neighbors.length > 0 && currentUserId) {
      fetchFriendsData();
    } else {
      setLoading(false);
    }
  }, [neighbors, currentUserId]);

  if (loading) {
    return <Loading />;
  }

  return (
    <ScrollView style={[styles.container, {backgroundColor: isDark ? '#181C1B' : '#f0f0f0',}]}>
      <Stack.Screen
        name="neighbors"
        options={{
          title: `Neighbors`,
          headerShown: true,
          headerStyle: { backgroundColor: isDark ? '#181C1B' : '#ffffff' },
          headerTitleStyle: { color: isDark ? 'white' : 'black' },
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable
              onPress={() => {router.push('/friends/add');}}
            >
              <MaterialCommunityIcons
                name="account-multiple-plus"
                size={24}
                color={isDark ? 'white' : 'black'}
                style={{ marginRight: 10 }}
              />
            </Pressable>
          ),
        }}
      />
      {friendsData.length > 0 ? (
        <View style={styles.friendsList}>
          {friendsData.map((friend) => (
            <View key={friend.id} style={[styles.friendCard, {backgroundColor:isDark ? '#2e3332' : 'white',}]}>
              <Text style={[styles.name, {color: isDark ? '#fff' : '#333',}]}>{friend.name}</Text>
              <Text style={[styles.details, { color: isDark ? '#798883' : '' }]}>{friend.age} years • from {friend.country}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#888', marginBottom: 12 }}>
            No neighbors yet!
          </Text>
          <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 }}>
            Tap the <Text style={{ fontWeight: 'bold', color: '#007AFF' }}>+</Text> icon at the top right to add your first neighbor.
          </Text>
        </View>
      )}
    </ScrollView>
  ); 
};

export default NeighborsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  friendsList: {
    width: '100%',
    padding: 16,
    flex: 1,
  }, 
  friendCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  details: {
    fontSize: 16,
    color: '#666',
  },
  text: {
    fontSize: 20,
    color: '#737373',
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
  }
});