import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

function useCheckins(mode: 'my' | 'tagged') {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      setError('Not signed in');
      setLoading(false);
      return;
    }

    let q = supabase
      .from('check_ins')
      .select('*')
      .order('created_at', { ascending: false });

    if (mode === 'my') {
      q = q.eq('poster_id', user.id);
    } else {
      q = q.contains('tagged_ids', [user.id]);
    }

    const { data: checkins, error: ciErr } = await q;

    if (ciErr) {
      setError(ciErr.message);
      setLoading(false);
      return;
    }
    if (!checkins || checkins.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const userIdSet = new Set<string>();
    checkins.forEach(ci => {
      userIdSet.add(ci.poster_id);
      ci.tagged_ids?.forEach((id: string) => userIdSet.add(id));
    });
    const allUserIds = Array.from(userIdSet);

    const { data: users, error: uErr } = await supabase
      .from('users')
      .select('id, name')
      .in('id', allUserIds);

    if (uErr) {
      setError(uErr.message);
      setLoading(false);
      return;
    }

    const poiIds = Array.from(
      new Set(checkins.map(ci => ci.thingy_id).filter(Boolean) as string[])
    );

    const { data: pois, error: pErr } = await supabase
      .from('poi')
      .select('id, title')
      .in('id', poiIds);

    if (pErr) {
      setError(pErr.message);
      setLoading(false);
      return;
    }

    const nameById = new Map(users?.map(u => [u.id, u.name]));
    const poiById  = new Map(pois?.map(p => [p.id, p.title]));

    const formatted = checkins.map(ci => ({
      id:         ci.id,
      caption:    ci.caption,
      image_url:  ci.image_url,
      created_at: ci.created_at,
      poster:     nameById.get(ci.poster_id) || 'Unknown',
      posterId:   ci.poster_id,
      tagged:     ci.tagged_ids?.map((id: string) => nameById.get(id) || 'Unknown') || [],
      poiTitle:   ci.thingy_id ? poiById.get(ci.thingy_id) : null,
    }));

    setItems(formatted);
    setLoading(false);
  }, [mode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { items, loading, error, refreshData: loadData };
}

export default function CheckinsScreen() {
  const [tab, setTab] = useState<'my' | 'tagged'>('my');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const { items, loading, error, refreshData } = useCheckins(tab);
  const isDark = useColorScheme() === 'dark';

  const deleteCheckin = useCallback(async (checkinId: string) => {
    try {
      const { error } = await supabase
        .from('check_ins')
        .delete()
        .eq('id', checkinId);

      if (error) {
        Alert.alert('Error', 'Failed to delete check-in. Please try again.');
        console.error('Error deleting check-in:', error);
      } else {
        Alert.alert('Success', 'Check-in deleted successfully.');
        refreshData(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting check-in:', error);
      Alert.alert('Error', 'Failed to delete check-in. Please try again.');
    }
  }, [refreshData]);

  const showActionMenu = useCallback((item: any) => {
    setSelectedItem(item);
    setModalVisible(true);
  }, []);

  const renderActionModal = () => {
    if (!selectedItem) return null;
    
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
              Check-in Options
            </Text>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                router.push(`/passport/checkins/${selectedItem.id}`);
              }}
            >
              <MaterialIcons name="visibility" size={20} color={isDark ? '#4CAF50' : '#2E7D32'} />
              <Text style={[styles.modalButtonText, { color: isDark ? '#fff' : '#000' }]}>
                View Details
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                Alert.alert(
                  'Delete Check-in',
                  'Are you sure you want to delete this check-in? This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive', 
                      onPress: () => deleteCheckin(selectedItem.id) 
                    },
                  ]
                );
              }}
            >
              <MaterialIcons name="delete" size={20} color={isDark ? '#f44336' : '#d32f2f'} />
              <Text style={[styles.modalButtonText, { color: isDark ? '#f44336' : '#d32f2f' }]}>
                Delete
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#181C1B' : '#fff' }]}>
      <Stack.Screen 
        options={{ 
          title: 'Check-ins',
          headerStyle: { backgroundColor: isDark ? '#181C1B' : '#fff' },
          headerTitleStyle: { color: isDark ? '#fff' : '#000' },
          headerTintColor: isDark ? '#fff' : '#000',
          headerShadowVisible: false,
        }} 
      />

      <View style={styles.subHeader}>
        {(['my','tagged'] as const).map(t => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[
              styles.tabButton,
              { backgroundColor: isDark ? '#2c2c2c' : '#fff' },
              tab === t && [styles.tabActive, { backgroundColor: isDark ? '#f54900' : '#ffd6a7' }]
            ]}
          >
            <Text style={[styles.tabText, { color: isDark ? '#fff' : '#000'}]}>
              {t === 'my' ? 'My Check-ins' : 'Tagged Check-ins'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && <ActivityIndicator size="small" color={isDark ? '#fff' : '#888'} style={{ marginTop: 20 }}/>}
      {error && <Text style={[styles.error, { color: isDark ? '#ff6b6b' : 'red' }]}>{error}</Text>}
      {!loading && !error && items.length === 0 && (
        <Text style={[styles.empty, { color: isDark ? '#888' : '#888' }]}>No check-ins here.</Text>
      )}

      {!loading && !error && items.map(ci => (
        <Pressable
          key={ci.id}
          style={[styles.card, { backgroundColor: isDark ? '#2e3332' : '#f9f9f9' }]}
          onPress={() => router.push(`/passport/checkins/${ci.id}`)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardContent}>
              <Text style={[styles.caption, { color: isDark ? '#fff' : '#333' }]}>{ci.caption}</Text>
              <Text style={[styles.meta, { color: isDark ? '#ccc' : '#555' }]}>
                {tab === 'tagged' && `By ${ci.poster} `}
                {ci.tagged.length > 0 && `With ${ci.tagged.join(', ')} `}
                <Text style={[styles.place, { color: isDark ? '#aaa' : '#777' }]}>{ci.poiTitle && `@ ${ci.poiTitle}`}</Text>
              </Text>
            </View>
            {tab === 'my' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => showActionMenu(ci)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons 
                  name="more-vert" 
                  size={20} 
                  color={isDark ? '#888' : '#666'} 
                />
              </TouchableOpacity>
            )}
          </View>
          {ci.image_url && (
            <Image
              source={{ uri: ci.image_url }}
              style={[styles.image, { borderColor: isDark ? '#333' : '#ddd' }]}
            />
          )}
        </Pressable>
      ))}
      
      {renderActionModal()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#fff', 
    paddingBottom: 60 
  },
  subHeader: { 
    flexDirection: 'row', 
    marginBottom: 16 
  },
  tabButton: {
    flex: 1, 
    alignItems: 'center', 
    padding: 10, 
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabActive: { 
    fontWeight: '500', 
  },
  tabText: { 
    fontSize: 16 
  },
  error: { 
    color: 'red', 
    textAlign: 'center', 
    marginVertical: 20 
  },
  empty: { 
    color: '#888', 
    textAlign: 'center', 
    marginVertical: 20 
  },
  card: {
    marginBottom: 16, 
    padding: 16, 
    borderRadius: 16,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, 
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardContent: {
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
  caption: { 
    fontSize: 16, 
    marginBottom: 8,
    color: '#333',
  },
  meta: { 
    fontSize: 16, 
    color: '#555',
    marginBottom: 8,
  },
  image: { 
    width: '100%', 
    height: 200, 
    borderRadius: 8, 
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 8,
  },
  place: {
    fontStyle: 'italic', 
    color: '#777',
    fontSize: 14,
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
    borderTopColor: '#eee',
    paddingTop: 16,
  },
});