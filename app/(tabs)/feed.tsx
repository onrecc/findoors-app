import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';

type FeedItem = {
  id: string;
  caption: string;
  image_url: string | null;
  created_at: string;
  poster: string;
  posterName: string;
  tagged: string[];
  poiTitle: string | null;
  timeAgo: string;
};

const FeedScreen = () => {
  console.log('[FeedScreen] Component mounting...');
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; posterName: string; posterId: string } | null>(null);
  const isDark = useColorScheme() === 'dark';

  // Load hidden items from AsyncStorage
  const loadHiddenItems = useCallback(async () => {
    console.log('[FeedScreen] Loading hidden items from AsyncStorage...');
    try {
      const hiddenItemsJson = await AsyncStorage.getItem('hiddenCheckins');
      console.log('[FeedScreen] Hidden items JSON:', hiddenItemsJson);
      if (hiddenItemsJson) {
        const hiddenArray = JSON.parse(hiddenItemsJson);
        console.log('[FeedScreen] Parsed hidden items array:', hiddenArray);
        setHiddenItems(new Set(hiddenArray));
      } else {
        console.log('[FeedScreen] No hidden items found in storage');
      }
    } catch (error) {
      console.error('[FeedScreen] Error loading hidden items:', error);
    }
  }, []);

  // Load blocked users from AsyncStorage
  const loadBlockedUsers = useCallback(async () => {
    console.log('[FeedScreen] Loading blocked users from AsyncStorage...');
    try {
      const blockedUsersJson = await AsyncStorage.getItem('blockedUsers');
      console.log('[FeedScreen] Blocked users JSON:', blockedUsersJson);
      if (blockedUsersJson) {
        const blockedArray = JSON.parse(blockedUsersJson);
        console.log('[FeedScreen] Parsed blocked users array:', blockedArray);
        setBlockedUsers(new Set(blockedArray));
      } else {
        console.log('[FeedScreen] No blocked users found in storage');
      }
    } catch (error) {
      console.error('[FeedScreen] Error loading blocked users:', error);
    }
  }, []);

  // Save hidden items to AsyncStorage
  const saveHiddenItems = useCallback(async (newHiddenItems: Set<string>) => {
    try {
      const hiddenArray = Array.from(newHiddenItems);
      await AsyncStorage.setItem('hiddenCheckins', JSON.stringify(hiddenArray));
    } catch (error) {
      console.error('Error saving hidden items:', error);
    }
  }, []);

  // Save blocked users to AsyncStorage
  const saveBlockedUsers = useCallback(async (newBlockedUsers: Set<string>) => {
    try {
      const blockedArray = Array.from(newBlockedUsers);
      await AsyncStorage.setItem('blockedUsers', JSON.stringify(blockedArray));
    } catch (error) {
      console.error('Error saving blocked users:', error);
    }
  }, []);

  // Hide an item
  const hideItem = useCallback(async (itemId: string) => {
    const newHiddenItems = new Set(hiddenItems);
    newHiddenItems.add(itemId);
    setHiddenItems(newHiddenItems);
    await saveHiddenItems(newHiddenItems);
  }, [hiddenItems, saveHiddenItems]);

  // Block a user
  const blockUser = useCallback(async (userId: string) => {
    const newBlockedUsers = new Set(blockedUsers);
    newBlockedUsers.add(userId);
    setBlockedUsers(newBlockedUsers);
    await saveBlockedUsers(newBlockedUsers);
  }, [blockedUsers, saveBlockedUsers]);

  // Unblock a user
  const unblockUser = useCallback(async (userId: string) => {
    const newBlockedUsers = new Set(blockedUsers);
    newBlockedUsers.delete(userId);
    setBlockedUsers(newBlockedUsers);
    await saveBlockedUsers(newBlockedUsers);
  }, [blockedUsers, saveBlockedUsers]);

  // Report an item
  const reportItem = useCallback(async (itemId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to report content');
        return;
      }

      const { error } = await supabase
        .from('reported_checkins')
        .insert({
          checkin_id: itemId,
          reporter_id: user.id,
          created_at: new Date().toISOString(),
        });

      if (error) {
        Alert.alert('Error', 'Failed to report content. Please try again.');
        console.error('Error reporting item:', error);
      } else {
        Alert.alert('Success', 'Content has been reported and will be reviewed.');
        // Also hide the item locally
        await hideItem(itemId);
      }
    } catch (error) {
      console.error('Error reporting item:', error);
      Alert.alert('Error', 'Failed to report content. Please try again.');
    }
  }, [hideItem]);

  // Show action menu
  const showActionMenu = useCallback((itemId: string, posterName: string, posterId: string) => {
    setSelectedItem({ id: itemId, posterName, posterId });
    setModalVisible(true);
  }, []);

  const fetchFeedData = useCallback(async () => {
    console.log('[FeedScreen] Starting fetchFeedData...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[FeedScreen] User:', user ? 'logged in' : 'not logged in');
      if (!user) {
        setError('Not signed in');
        return;
      }

      console.log('[FeedScreen] Fetching friends for user:', user.id);
      // Get user's friends
      const { data: friendRecords, error: friendsError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id);

      console.log('[FeedScreen] Friends query result:', { friendRecords, friendsError });
      if (friendsError) {
        console.error('[FeedScreen] Friends error:', friendsError);
        setError(friendsError.message);
        return;
      }

      const friendIds = friendRecords?.map(f => f.friend_id) || [];
      console.log('[FeedScreen] Friend IDs:', friendIds);
      
      // Include user's own posts in the feed
      const allUserIds = [user.id, ...friendIds];
      console.log('[FeedScreen] All user IDs to fetch posts from:', allUserIds);

      if (allUserIds.length === 0) {
        console.log('[FeedScreen] No user IDs, setting empty feed');
        setFeedItems([]);
        return;
      }

      console.log('[FeedScreen] Fetching check-ins...');
      // Get check-ins from friends and self
      const { data: checkIns, error: checkInsError } = await supabase
        .from('check_ins')
        .select('*')
        .in('poster_id', allUserIds)
        .order('created_at', { ascending: false })
        .limit(50);

      console.log('[FeedScreen] Check-ins query result:', { 
        checkInsCount: checkIns?.length || 0, 
        checkInsError 
      });

      if (checkInsError) {
        console.error('[FeedScreen] Check-ins error:', checkInsError);
        setError(checkInsError.message);
        return;
      }

      if (!checkIns || checkIns.length === 0) {
        console.log('[FeedScreen] No check-ins found, setting empty feed');
        setFeedItems([]);
        return;
      }

      console.log('[FeedScreen] Processing user information...');
      // Get user information for all posters and tagged users
      const userIdSet = new Set<string>();
      checkIns.forEach(ci => {
        userIdSet.add(ci.poster_id);
        ci.tagged_ids?.forEach((id: string) => userIdSet.add(id));
      });

      console.log('[FeedScreen] Unique user IDs to fetch:', Array.from(userIdSet));
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name')
        .in('id', Array.from(userIdSet));

      console.log('[FeedScreen] Users query result:', { 
        usersCount: users?.length || 0, 
        usersError 
      });

      if (usersError) {
        console.error('[FeedScreen] Users error:', usersError);
        setError(usersError.message);
        return;
      }

      console.log('[FeedScreen] Processing POI information...');
      // Get POI information
      const poiIds = Array.from(
        new Set(checkIns.map(ci => ci.thingy_id).filter(Boolean) as string[])
      );

      console.log('[FeedScreen] POI IDs to fetch:', poiIds);
      const { data: pois, error: poisError } = await supabase
        .from('poi')
        .select('id, title')
        .in('id', poiIds);

      console.log('[FeedScreen] POIs query result:', { 
        poisCount: pois?.length || 0, 
        poisError 
      });

      if (poisError) {
        console.error('[FeedScreen] POIs error:', poisError);
        setError(poisError.message);
        return;
      }

      // Create lookup maps
      const nameById = new Map(users?.map(u => [u.id, u.name]) || []);
      const poiById = new Map(pois?.map(p => [p.id, p.title]) || []);

      console.log('[FeedScreen] Hidden items count:', hiddenItems.size);
      console.log('[FeedScreen] Blocked users count:', blockedUsers.size);
      console.log('[FeedScreen] Formatting feed items...');

      // Format feed items and filter out hidden ones and posts from blocked users
      const formatted = checkIns
        .filter(ci => {
          const isHidden = hiddenItems.has(ci.id);
          const isFromBlockedUser = blockedUsers.has(ci.poster_id);
          if (isHidden) {
            console.log('[FeedScreen] Filtering out hidden item:', ci.id);
          }
          if (isFromBlockedUser) {
            console.log('[FeedScreen] Filtering out post from blocked user:', ci.poster_id);
          }
          return !isHidden && !isFromBlockedUser;
        })
        .map(ci => ({
          id: ci.id,
          caption: ci.caption,
          image_url: ci.image_url,
          created_at: ci.created_at,
          poster: ci.poster_id,
          posterName: nameById.get(ci.poster_id) || 'Unknown',
          tagged: ci.tagged_ids?.map((id: string) => nameById.get(id) || 'Unknown') || [],
          poiTitle: ci.thingy_id ? poiById.get(ci.thingy_id) || null : null,
          timeAgo: getTimeAgo(ci.created_at),
        }));

      console.log('[FeedScreen] Final formatted items count:', formatted.length);
      setFeedItems(formatted);
      setError(null);
      console.log('[FeedScreen] fetchFeedData completed successfully');
    } catch (err: any) {
      console.error('[FeedScreen] fetchFeedData error:', err);
      setError(err.message || 'An error occurred');
    }
  }, [hiddenItems, blockedUsers]);

  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    console.log('[FeedScreen] useEffect triggered - starting data initialization');
    const initializeData = async () => {
      console.log('[FeedScreen] Setting loading to true');
      setLoading(true);
      
      console.log('[FeedScreen] Loading hidden items...');
      await loadHiddenItems();
      
      console.log('[FeedScreen] Loading blocked users...');
      await loadBlockedUsers();
      
      console.log('[FeedScreen] Fetching feed data...');
      await fetchFeedData();
      
      console.log('[FeedScreen] Setting loading to false');
      setLoading(false);
      console.log('[FeedScreen] Data initialization complete');
    };
    initializeData();
  }, [fetchFeedData, loadHiddenItems, loadBlockedUsers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeedData();
    setRefreshing(false);
  };

  const renderFeedItem = ({ item }: { item: FeedItem }) => (
    <FeedItemComponent item={item} isDark={isDark} onShowActions={showActionMenu} />
  );

  const renderActionModal = () => {
    if (!selectedItem) return null;
    
    const isUserBlocked = blockedUsers.has(selectedItem.posterId);
    
    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#2c2c2c' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>
              {selectedItem.posterName}&apos;s post
            </Text>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                hideItem(selectedItem.id);
              }}
            >
              <MaterialIcons name="visibility-off" size={20} color={isDark ? '#fff' : '#000'} />
              <Text style={[styles.modalButtonText, { color: isDark ? '#fff' : '#000' }]}>
                Hide this post
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                Alert.alert(
                  'Report Content',
                  'Are you sure you want to report this content? This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Report', style: 'destructive', onPress: () => reportItem(selectedItem.id) },
                  ]
                );
              }}
            >
              <MaterialIcons name="report" size={20} color={isDark ? '#ff9800' : '#f57c00'} />
              <Text style={[styles.modalButtonText, { color: isDark ? '#ff9800' : '#f57c00' }]}>
                Report
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                if (isUserBlocked) {
                  Alert.alert(
                    'Unblock User',
                    `Are you sure you want to unblock ${selectedItem.posterName}? You will start seeing their posts again.`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Unblock', 
                        onPress: () => unblockUser(selectedItem.posterId) 
                      },
                    ]
                  );
                } else {
                  Alert.alert(
                    'Block User',
                    `Are you sure you want to block ${selectedItem.posterName}? You will no longer see any of their posts.`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Block', 
                        style: 'destructive', 
                        onPress: () => blockUser(selectedItem.posterId) 
                      },
                    ]
                  );
                }
              }}
            >
              <MaterialIcons 
                name={isUserBlocked ? "person-add" : "block"} 
                size={20} 
                color={isUserBlocked ? (isDark ? '#4CAF50' : '#2E7D32') : (isDark ? '#f44336' : '#d32f2f')} 
              />
              <Text style={[
                styles.modalButtonText, 
                { color: isUserBlocked ? (isDark ? '#4CAF50' : '#2E7D32') : (isDark ? '#f44336' : '#d32f2f') }
              ]}>
                {isUserBlocked ? 'Unblock user' : 'Block user'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { borderTopColor: isDark ? '#444' : '#eee' }]}
              onPress={() => setModalVisible(false)}
            >
              <MaterialIcons name="close" size={20} color={isDark ? '#d4d4d4' : '#666'} />
              <Text style={[styles.modalButtonText, { color: isDark ? '#d4d4d4' : '#666' }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? '#181C1B' : '#fff' }]}>
        <Stack.Screen
          options={{
            title: 'Feed',
            headerStyle: { backgroundColor: isDark ? '#181C1B' : '#fff' },
            headerTitleStyle: { color: isDark ? '#fff' : '#000' },
            headerTintColor: isDark ? '#fff' : '#000',
          }}
        />
        <ActivityIndicator size="small" color={isDark ? '#c3ccc8' : '#000'} />
        {/* <Text style={[styles.loadingText, { color: isDark ? '#c3ccc8' : '#000' }]}>
          Loading feed...
        </Text> */}
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? '#181C1B' : '#fff' }]}>
        <Text style={[styles.errorText, { color: isDark ? '#ff6b6b' : 'red' }]}>
          {error}
        </Text>
        <Pressable 
          style={[styles.retryButton, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}
          onPress={() => {
            setError(null);
            setLoading(true);
            fetchFeedData().finally(() => setLoading(false));
          }}
        >
          <Text style={[styles.retryText, { color: isDark ? '#fff' : '#000' }]}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#181C1B' : '#f5f5f5' }]}>
      <Stack.Screen
        options={{
          title: 'Feed',
          headerStyle: { backgroundColor: isDark ? '#181C1B' : '#fff' },
          headerTitleStyle: { color: isDark ? '#fff' : '#000' },
          headerTintColor: isDark ? '#fff' : '#000',
        }}
      />
      
      <FlatList
        style={{ marginBottom: 85 }}
        data={feedItems}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={isDark ? '#e5e5e5' : '#262626'}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: isDark ? '#888' : '#666' }]}>
              No posts yet. Add some friends or check in at places to see content here!
            </Text>
          </View>
        }
        contentContainerStyle={feedItems.length === 0 ? { flex: 1 } : undefined}
        showsVerticalScrollIndicator={false}
      />
      
      {renderActionModal()}
    </View>
  );
};

const FeedItemComponent = ({ 
  item, 
  isDark, 
  onShowActions 
}: { 
  item: FeedItem; 
  isDark: boolean; 
  onShowActions: (itemId: string, posterName: string, posterId: string) => void;
}) => {
  return (
    <Pressable 
      style={[styles.feedItem, { backgroundColor: isDark ? '#2e3332' : '#fff' }]}
      onPress={() => router.push(`/passport/checkins/${item.id}`)}
    >
      <View style={styles.feedHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: isDark ? '#9eaaa5' : '#ddd' }]}>
            <Text style={[styles.avatarText, { color: isDark ? '#4a5753' : '#666' }]}>
              {item.posterName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: isDark ? '#fff' : '#000' }]}>
              {item.posterName}
            </Text>
            <Text style={[styles.timeAgo, { color: isDark ? '#9eaaa5' : '#666' }]}>
              {item.timeAgo}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onShowActions(item.id, item.posterName, item.poster)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons 
            name="more-vert" 
            size={20} 
            color={isDark ? '#9eaaa5' : '#666'} 
          />
        </TouchableOpacity>
      </View>

      {item.caption && (
        <Text style={[styles.caption, { color: isDark ? '#e1e6e4' : '#333' }]}>
          {item.caption}
        </Text>
      )}

      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.feedImage} />
      )}

      <View style={styles.feedFooter}>
        {item.tagged.length > 0 && (
          <Text style={[styles.taggedText, { color: isDark ? '#9eaaa5' : '#666' }]}>
            With {item.tagged.join(', ')}
          </Text>
        )}
        {item.poiTitle && (
          <Text style={[styles.locationText, { color: isDark ? '#9eaaa5' : '#666' }]}>
            📍 {item.poiTitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

export default FeedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  feedItem: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 12,
    marginTop: 2,
  },
  caption: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  feedImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  feedFooter: {
    gap: 4,
  },
  taggedText: {
    fontSize: 14,
  },
  locationText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 10,
    paddingTop: 20,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalButtonText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  cancelButton: {
    marginTop: 8,
    borderTopWidth: 1,
    paddingTop: 16,
  },
});