import { supabase } from '@/lib/supabase';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapboxGL from '@rnmapbox/maps';
import { Stack } from 'expo-router';
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View
} from 'react-native';

// Map Picker Bottom Sheet (unchanged)
interface MapPickerModalProps {
  initialLocation?: { lat: number; lon: number } | null;
  onConfirm: (location: { lat: number; lon: number }) => void;
  onClose?: () => void;
}
const MapPickerModal = forwardRef<BottomSheetModal, MapPickerModalProps>(({ initialLocation, onConfirm, onClose }, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['96%'], []);
  const [marker, setMarker] = useState(initialLocation || { lat: 37.77, lon: -122.42 });

  useImperativeHandle(ref, () => sheetRef.current as any);

  const isDark = useColorScheme() === 'dark';

  const handleMapPress = (e: any) => {
    const [lon, lat] = e.geometry.coordinates;
    setMarker({ lat, lon });
  };

  const handleConfirm = () => {
    onConfirm(marker);
    (sheetRef.current as any)?.close();
    onClose?.();
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={isDark ? [styles.modalBackground, { backgroundColor: '#2e3332' }] : styles.modalBackground}
      handleIndicatorStyle={isDark ? [styles.handle, { backgroundColor: '#444' }] : styles.handle}
      onDismiss={onClose}
    >
      <BottomSheetView style={[styles.mapContainer, isDark && { backgroundColor: '#2e3332' }]}> 
        <MapboxGL.MapView style={styles.map} onPress={handleMapPress}>
          <MapboxGL.Camera zoomLevel={14} centerCoordinate={[marker.lon, marker.lat]} />
          <MapboxGL.ShapeSource
            id="markerSource"
            shape={{
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [marker.lon, marker.lat] },
              properties: {},
            }}
          >
            <MapboxGL.CircleLayer
              id="markerCircle"
              style={{
                circleRadius: 8,
                circleColor: '#FF0000',
                circleStrokeWidth: 2,
                circleStrokeColor: '#FFFFFF',
              }}
            />
          </MapboxGL.ShapeSource>
        </MapboxGL.MapView>
        <Pressable style={[styles.confirmButton, isDark && { backgroundColor: '#ff6900' }]} onPress={handleConfirm}>
          <Text style={[styles.confirmText, isDark && { color: '#fff' }]}>Place Pin Here</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
});
MapPickerModal.displayName = 'MapPickerModal';

// iOS Bottom-Sheet DateTime Picker (unchanged)
interface DateTimePickerModalProps {
  initialDateTime?: Date;
  onConfirm: (date: Date) => void;
  onClose?: () => void;
  label: string;
}
const DateTimePickerModal = forwardRef<BottomSheetModal, DateTimePickerModalProps>(({ initialDateTime, onConfirm, onClose, label }, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['85%'], []);
  const [date, setDate] = useState<Date>(initialDateTime || new Date());
  const isDark = useColorScheme() === 'dark';

  useImperativeHandle(ref, () => sheetRef.current as any);

  const handleDateChange = (_: any, selected: Date | undefined) => {
    if (selected) {
      setDate((prev: Date) => {
        const d = new Date(prev);
        d.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        return d;
      });
    }
  };
  const handleTimeChange = (_: any, selected: Date | undefined) => {
    if (selected) {
      setDate((prev: Date) => {
        const d = new Date(prev);
        d.setHours(selected.getHours(), selected.getMinutes());
        return d;
      });
    }
  };
  const handleConfirm = () => {
    onConfirm(date);
    (sheetRef.current as any)?.close();
    onClose?.();
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={isDark ? [styles.modalBackground, { backgroundColor: '#262626' }] : styles.modalBackground}
      handleIndicatorStyle={isDark ? [styles.handle, { backgroundColor: '#444' }] : styles.handle}
      onDismiss={onClose}
    >
      <BottomSheetView style={[styles.pickerContainer, isDark && { backgroundColor: '#262626' }]}> 
        <Text style={[styles.pickerLabel, isDark && { color: '#e5e5e5' }]}>Select {label} Date</Text>
        <DateTimePicker
          value={date}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          style={[styles.picker, { backgroundColor: isDark ? '#252525' : '#FAFAFA' }]}
          textColor={isDark ? '#fff' : '#000'}
        />
        <Text style={[styles.pickerLabel, isDark && { color: '#e5e5e5' }]}>Select {label} Time</Text>
        <DateTimePicker
          value={date}
          mode="time"
          display="spinner"
          onChange={handleTimeChange}
          style={[styles.picker, { backgroundColor: isDark ? '#252525' : '#FAFAFA' }]}
          textColor={isDark ? '#fff' : '#000'}
        />
        <Pressable style={[styles.confirmButton, isDark && { backgroundColor: '#ff6900', width: '90%' }]} onPress={handleConfirm}>
          <Text style={[styles.confirmText, isDark && { color: '#fff' }]}>Confirm {label} Time</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
});
DateTimePickerModal.displayName = 'DateTimePickerModal';

const CreateEventPage = () => {
  const mapModalRef = useRef<any>(null);
  const startModalRef = useRef<any>(null);
  const endModalRef = useRef<any>(null);

  const isDark = useColorScheme() === 'dark';

  const [eventName, setEventName] = useState('');
  const [startDateTime, setStartDateTime] = useState(new Date());
  const [endDateTime, setEndDateTime] = useState(
    new Date(new Date().getTime() + 2 * 60 * 60 * 1000)
  );
  const [eventLocation, setEventLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [eventDescription, setEventDescription] = useState('');

  // Android-only picker state
  const [androidPicker, setAndroidPicker] = useState<{
    show: boolean;
    mode: 'date' | 'time';
    for: 'start' | 'end';
  }>({
    show: false,
    mode: 'date',
    for: 'start',
  });

  // Open handlers
  const openMap = () => mapModalRef.current?.present();

  // iOS bottom-sheet opens
  const openStart = () => startModalRef.current?.present();
  const openEnd = () => endModalRef.current?.present();

  // Android native picker change handler
  const onAndroidChange = (event: any, selected: Date | undefined) => {
    // hide current
    setAndroidPicker((prev) => ({ ...prev, show: false }));
    if (event.type === 'dismissed' || !selected) return;

    const { for: which, mode } = androidPicker;
    const setter = which === 'start' ? setStartDateTime : setEndDateTime;
    setter((prev) => {
      const d = new Date(prev);
      if (mode === 'date') {
        d.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      } else {
        d.setHours(selected.getHours(), selected.getMinutes());
      }
      return d;
    });

    // if we just picked date, open time next
    if (mode === 'date') {
      setAndroidPicker({ show: true, mode: 'time', for: which });
    }
  };

  // Submit
  const handleSubmit = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from('user_events').insert({
      name:        eventName,
      organizer:   user?.id,
      start:       startDateTime.toISOString(),
      end:         endDateTime.toISOString(),
      description: eventDescription,
      lat:         eventLocation?.lat || null,
      lon:         eventLocation?.lon || null,
    });

    Alert.alert('Success', 'Your event has been created!');
    // reset
    setEventName('');
    setStartDateTime(new Date());
    setEndDateTime(new Date(new Date().getTime() + 2 * 60 * 60 * 1000));
    setEventLocation(null);
    setEventDescription('');
  };

  return (
    <BottomSheetModalProvider>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#181C1B' : '#F7F5F2' }]}>
        <Stack.Screen options={{
          title: 'Create New Event',
          headerStyle: { backgroundColor: isDark ? '#181C1B' : '#f5f5f5' },
          headerTitleStyle: { color: isDark ? '#fff' : '#000' },
          // headerTintColor: isDark ? '#fff' : '#000',
          headerShadowVisible: false,
        }} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {/* Event Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#a1a1a1' : '#555' }]}>Event Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#2e3332' : '#FAFAFA', borderColor: isDark ? '#525252' : '#DDD', color: isDark ? '#e5e5e5' : '#333' }]}
                value={eventName}
                onChangeText={setEventName}
                placeholder="e.g. Sunday Brunch"
                placeholderTextColor="#999"
              />
            </View>

            {/* Start */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#a1a1a1' : '#555' }]}>Start</Text>
              <Pressable
                style={[styles.input, { backgroundColor: isDark ? '#2e3332' : '#FAFAFA', borderColor: isDark ? '#525252' : '#DDD' }]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Keyboard.dismiss();
                  }
                  if (Platform.OS === 'ios') openStart();
                  else setAndroidPicker({ show: true, mode: 'date', for: 'start' });
                }}
              >
                <Text style={{ color: isDark ? '#e5e5e5' : '#333' }}>
                  {startDateTime.toDateString()} @{' '}
                  {startDateTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </Pressable>
            </View>

            {/* End */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#a1a1a1' : '#555' }]}>End</Text>
              <Pressable
                style={[styles.input, { backgroundColor: isDark ? '#2e3332' : '#FAFAFA', borderColor: isDark ? '#525252' : '#DDD' }]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Keyboard.dismiss();
                  }
                  if (Platform.OS === 'ios') openEnd();
                  else setAndroidPicker({ show: true, mode: 'date', for: 'end' });
                }}
              >
                <Text style={{ color: isDark ? '#e5e5e5' : '#333' }}>
                  {endDateTime.toDateString()} @{' '}
                  {endDateTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </Pressable>
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#a1a1a1' : '#555' }]}>Event Location</Text>
              <Pressable
              style={[styles.input, { backgroundColor: isDark ? '#2e3332' : '#FAFAFA', borderColor: isDark ? '#525252' : '#DDD' }]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Keyboard.dismiss();
                }
                openMap();
              }}
              >
              <Text style={{ color: isDark ? '#e5e5e5' : '#333' }}>
                {eventLocation
                ? `📍 ${eventLocation.lat.toFixed(4)}, ${eventLocation.lon.toFixed(4)}`
                : 'Pin on map...'}
              </Text>
              </Pressable>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#a1a1a1' : '#555' }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: isDark ? '#2e3332' : '#FAFAFA', borderColor: isDark ? '#525252' : '#DDD', color: isDark ? '#e5e5e5' : '#333' }]}
                value={eventDescription}
                onChangeText={setEventDescription}
                placeholder="Tell us more..."
                placeholderTextColor="#999"
                multiline
              />
            </View>

            <Pressable
              style={[
              styles.button,
              { backgroundColor: isDark ? '#ff6900' : '#ff6900', opacity: eventName && eventLocation && eventDescription ? 1 : 0.5 }
              ]}
              onPress={handleSubmit}
              disabled={!(eventName && eventLocation && eventDescription)}
            >
              <Text style={styles.buttonText}>Create Event</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Android native picker */}
        {androidPicker.show && (
          <DateTimePicker
            value={androidPicker.for === 'start' ? startDateTime : endDateTime}
            mode={androidPicker.mode}
            display="default"
            onChange={onAndroidChange}
          />
        )}

        {/* Bottom Sheets (iOS only) */}
        <MapPickerModal
          ref={mapModalRef}
          initialLocation={eventLocation}
          onConfirm={setEventLocation}
        />
        {Platform.OS === 'ios' && (
          <>
            <DateTimePickerModal
              ref={startModalRef}
              initialDateTime={startDateTime}
              onConfirm={setStartDateTime}
              label="Start"
            />
            <DateTimePickerModal
              ref={endModalRef}
              initialDateTime={endDateTime}
              onConfirm={setEndDateTime}
              label="End"
            />
          </>
        )}
      </SafeAreaView>
    </BottomSheetModalProvider>
  );
};

export default CreateEventPage;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  content: {
    padding: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 6 },
  input: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    // backgroundColor: '#FAFAFA',
  },
  // inputText: { color: '#333' },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: {
    marginTop: 10,
    paddingVertical: 14,
    backgroundColor: '#8AB6D6',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  modalBackground: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ccc',
    marginBottom: 8,
  },
  mapContainer: { flex: 1, padding: 10 },
  map: { flex: 1, borderRadius: 16, height: 500 },
  pickerContainer: { flex: 1, alignItems: 'center', paddingTop: 10 },
  pickerLabel: { fontSize: 16, color: '#555', marginVertical: 6 },
  picker: {
    width: '90%',
    // backgroundColor: '#FAFAFA',
    borderRadius:  16,
    marginBottom: 10,
    color: '#333',
  },
  confirmButton: {
    marginTop: 10,
    marginBottom: 30,
    paddingVertical: 12,
    paddingHorizontal: 8,
    // backgroundColor: '#8AB6D6',
    width: '100%',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});