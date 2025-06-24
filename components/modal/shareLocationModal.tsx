import { supabase } from '@/lib/supabase';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import SelectFriendsModal from './selectFriendsModal';

export type ShareLocationModalMethods = {
  present: () => void;
  close: () => void;
};

interface Props {
  /**
   * Called when the user taps "Share Location".
   * Always provides the list of friend IDs to share with.
   */
  onSubmit: (data: {
    isPrecise: boolean;
    radiusMeters?: number;
    friendUserIds: string[];
    durationHours: number;
    description?: string;
  }) => void;
  onClose: () => void;
}

const RADIUS_PRESETS = [50, 100, 500, 1000] as const;
const DURATION_PRESETS: { label: string; value: number | 'until_off' }[] = [
  { label: '1 hour', value: 1 },
  { label: '3 hours', value: 3 },
  { label: '6 hours', value: 6 },
  { label: 'Until off', value: 'until_off' },
];

const ShareLocationModal = forwardRef<ShareLocationModalMethods, Props>(
  ({ onSubmit, onClose }, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ['60%', '90%'], []);

    // UI state
    const [isPrecise, setIsPrecise] = useState(true);
    const [selectedRadius, setSelectedRadius] = useState<number>(RADIUS_PRESETS[1]);
    const [visibility, setVisibility] = useState<'friends' | 'specific'>('friends');
    const [specificFriendIds, setSpecificFriendIds] = useState<string[]>([]);
    const [allFriendIds, setAllFriendIds] = useState<string[]>([]);
    const [duration, setDuration] = useState<number | 'until_off'>(1);
    const [description, setDescription] = useState<string>('');
    const [friendModalVisible, setFriendModalVisible] = useState(false);

    const isDark = useColorScheme() === 'dark';

    // Fetch all friends once on mount
    useEffect(() => {
      (async () => {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) return;

        const { data: friendRecords, error: friendsError } = await supabase
          .from('friends')
          .select('*')
          .eq('user_id', user.id);
        if (friendsError || !friendRecords) return;

        setAllFriendIds(friendRecords.map((r) => r.friend_id));
      })();
    }, []);

    useImperativeHandle(ref, () => ({
      present: () => {
        sheetRef.current?.present();
        sheetRef.current?.snapToIndex(0);
      },
      close: () => sheetRef.current?.close(),
    }));

    const handleShare = () => {
      // Determine target IDs based on visibility
      const friendUserIds =
        visibility === 'specific' ? specificFriendIds : allFriendIds;

      if (duration === 'until_off') {
        setDuration(0);
      }

      onSubmit({
        isPrecise,
        radiusMeters: isPrecise ? undefined : selectedRadius,
        visibility,
        friendUserIds,
        durationHours: duration,
        description: description.trim() || undefined,
      });
      sheetRef.current?.close();
    };

    const renderOptionGroup = <T extends string | number>(
      label: string,
      options: { label: string; value: T }[],
      selected: T,
      onSelect: (val: T) => void
    ) => (
      <View style={styles.group}>
        <Text style={[styles.groupLabel, { color: isDark ? '#d4d4d4' : '#333' }]}>{label}</Text>
        <View style={styles.optionsRow}>
          {options.map((opt) => (
            <Pressable
              key={String(opt.value)}
              style={[
                styles.optionButton,
                { borderColor: isDark ? '#444' : '#ccc', backgroundColor: isDark ? '#262626' : '#f8f8f8' },
                selected === opt.value && styles.optionButtonSelected,
              ]}
              onPress={() => onSelect(opt.value as any)}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: isDark ? '#a1a1a1' : '#333' },
                  selected === opt.value && styles.optionTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );

    return (
      <>  
        <BottomSheetModal
          ref={sheetRef}
          index={0}
          snapPoints={snapPoints}
          enablePanDownToClose
          backgroundStyle={[styles.background, { backgroundColor: isDark ? '#1e1e1e' : '#fff' }]}
          handleIndicatorStyle={[styles.handle, { backgroundColor: isDark ? '#444' : '#ccc' }]}
          onDismiss={onClose}
          style={styles.sheet}
        >
          <BottomSheetScrollView
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerRow}>
              <Text style={[styles.header, { color: isDark ? '#f5f5f5' : '#333' }]}>Share Your Location</Text>
              <Pressable
                onPress={() => Keyboard.dismiss()}
                style={styles.closeKeyboard}
              >
                <Text style={styles.closeText}>Close Keyboard</Text>
              </Pressable>
            </View>

            {/*}
            {renderOptionGroup(
              'Precision',
              [
                { label: 'Precise', value: true },
                { label: 'Radius', value: false },
              ],
              isPrecise,
              setIsPrecise
            )}

            {!isPrecise &&
              renderOptionGroup(
                'Radius',
                RADIUS_PRESETS.map((r) => ({ label: r >= 1000 ? `${r / 1000} km` : `${r} m`, value: r })),
                selectedRadius,
                setSelectedRadius
              )}
            */}

            {renderOptionGroup(
              'Who can see',
              [
                { label: 'Friends', value: 'friends' },
                { label: 'Specific...', value: 'specific' },
              ],
              visibility,
              setVisibility as any
            )}

            {visibility === 'specific' && (
              <Pressable
                style={styles.selectButton}
                onPress={() => setFriendModalVisible(true)}
              >
                <Text style={styles.selectText}>
                  {specificFriendIds.length > 0
                    ? `Selected (${specificFriendIds.length})`
                    : 'Select Friends'}
                </Text>
              </Pressable>
            )}

            {renderOptionGroup(
              'Duration',
              DURATION_PRESETS,
              duration,
              setDuration as any
            )}

            <View style={styles.group}>
              <Text style={[styles.groupLabel, { color: isDark ? '#d4d4d4' : '#333' }]}>
                Note <Text style={{ fontWeight: '300', fontSize: 12 }}>(optional)</Text>
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: isDark ? '#262626' : '#f8f8f8', color: isDark ? '#e5e5e5' : '#333', borderColor: isDark ? '#444' : '#ccc' }]}
                placeholder="Where or why are you going..."
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>

            <Pressable style={[styles.submitButton, { backgroundColor: '#f54900' }]} onPress={handleShare}>
              <Text style={styles.submitText}>Share Location</Text>
            </Pressable>
          </BottomSheetScrollView>
        </BottomSheetModal>

        <SelectFriendsModal
          visible={friendModalVisible}
          initialSelected={specificFriendIds}
          onClose={() => setFriendModalVisible(false)}
          onSubmit={(ids) => {
            setSpecificFriendIds(ids);
            setFriendModalVisible(false);
          }}
        />
      </>  
    );
  }
);

ShareLocationModal.displayName = 'ShareLocationModal';
export default ShareLocationModal;

const styles = StyleSheet.create({
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  background: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ccc',
    marginTop: 0,
    marginBottom: 10,
  },
  contentContainer: {
    paddingHorizontal: 20,
    flexGrow: 1,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: { fontSize: 20, fontWeight: '700' },
  closeKeyboard: { paddingHorizontal: 8, paddingVertical: 4 },
  closeText: { fontSize: 14, color: '#007AFF', fontWeight: '500' },
  group: { marginVertical: 8 },
  groupLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    // borderColor: '#ccc',
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#ff8904', 
    borderColor: '#ff8904',
  },
  optionText: { fontSize: 14, color: '#333' }, 
  optionTextSelected: { color: '#fff', fontWeight: '600' },
  selectButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EFEFF4',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  selectText: { fontSize: 14, color: '#007AFF', fontWeight: '500' },

  textInput: {
    color: '#333',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
