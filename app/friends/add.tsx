import { supabase } from '@/lib/supabase';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Clipboard, Pressable, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import QRCode from 'react-native-qrcode-svg';


const AddFriendsScreen = () => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [friendId, setFriendId] = useState('');
  const [myFriendCode, setMyFriendCode] = useState('Loading...');

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Add Friends',
      headerStyle: {
        backgroundColor: isDark ? '#181C1B' : '#f5f5f5',
      },
      headerShadowVisible: false,
      headerTintColor: isDark ? '#ffffff' : '#000000',
      headerTitleStyle: {
        fontWeight: 'bold',
        color: isDark ? '#ffffff' : '#000000',
      },
    });
  }, [navigation, isDark]);

  const fetchFriendId = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('friend_code')
        .select('*')
        .eq('code', code)
        .single();
      if (error) {
        console.error('Error fetching friend ID:', error.message);
        Alert.alert('Oops', 'Friend code looks invalid. Please check and try again.');
      } else if (data) {
        console.log('Fetched Friend ID:', data.user_id);
        return data.user_id; 
      } else {
        Alert.alert('Not Found', 'No friend found with this code.');
        return null;
      }
    } catch (error) {
      console.error('Unexpected error fetching friend ID:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      return null;
    }
  };

  const fetchMyFriendCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('friend_code')
          .select('code')
          .eq('user_id', user.id)
          .single();
        if (error) {
          console.error('Error fetching my friend code:', error.message);
          Alert.alert('Error', 'Failed to fetch your friend code. Please try again.');
        } else if (data) {
          setMyFriendCode(data.code);
        } else {
          Alert.alert('Not Found', 'Your friend code was not found.');
        }
      } else {
        Alert.alert('Error', 'You are not logged in. Please log in to continue.');
      }
    } catch (error) {
      console.error('Unexpected error fetching my friend code:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  useEffect(() => {
    fetchMyFriendCode();
  }, []);

  const handleAddFriend = () => {
    if (friendId.length === 6) {
      console.log('Adding friend with ID:', friendId);
      fetchFriendId(friendId).then(async (fetchedFriendId) => {
        if (fetchedFriendId) {
          console.log('Fetched Friend ID:', fetchedFriendId);
          const { data: { user } } = await supabase.auth.getUser()
          supabase
            .from('friends')
            .insert([{ user_id: user?.id, friend_id: fetchedFriendId }])
            .then(({ error }) => {
              if (error) {
                console.error('Error adding friend:', error.message);
                Alert.alert('Error', 'Failed to add friend. Please try again.');
              } else {
                Alert.alert('Success', 'Friend added successfully!');
              }
            });
        }
      });
      setFriendId(''); // Clear input after submission
    } else {
      Alert.alert('Invalid ID', 'Friend ID must be 6 characters long.');
    } 
  };

  return (
    <View style={[styles.container, {backgroundColor: isDark ? '#181C1B' : '#f5f5f5'}]}>
      <View style={styles.yourCodeContainer}>
        <Text style={[styles.yourCodeLabel, {color: isDark ? '#e5e5e5' :'#333'}]}>Your friend code:</Text>
        <Pressable style={[styles.innerContainer, {borderColor: isDark ? '#343b39' : '#ccc', backgroundColor: isDark ? '#00000040' : '#ffffff'}]} onPress={() => {Clipboard.setString(myFriendCode); Alert.alert('Copied!')}}>
          <QRCode
            value={myFriendCode as string}
            size={170} 
            color={myFriendCode === "Loading..." ? isDark ? "transparent" : '#000000' : isDark ? '#f6f7f7' : "#262626"} 
            backgroundColor={isDark ? "transparent" : "#ffffff"}
          />
          <Text style={[styles.myCode, {color: isDark ? '#ff8904' : '#f54900'}]}>{myFriendCode}</Text>
        </Pressable>

        {/* <Button
          title="Show QR Code"
          onPress={() => router.push(`/friends/qr/${myFriendCode}`)}
        /> */}
      </View>
      
      <Text style={[styles.label, { color: isDark ? '#798883' : '' }]}>Enter Friend Code</Text>
      <View style={[styles.codeInputContainer, {borderColor: isDark ? '#262626' : '#ccc',}]}>
        <TextInput
          style={[styles.codeInput, { letterSpacing: 12, textAlign: 'center', backgroundColor: isDark ? '#00000050' : '#fff', color: isDark ? '#fafafa' : '#333', borderColor: isDark ? '#44444470' : '#ccc' }]}
          value={friendId}
          onChangeText={setFriendId}
          maxLength={6}
          autoCapitalize="characters"
          placeholder="XXXXXX"
          placeholderTextColor="#AAAAAA"
          autoCorrect={false}
        />
      </View>
      
      <Button
        title="Add Friend" 
        onPress={handleAddFriend} 
        disabled={friendId.length !== 6}
        color="#4285F4"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: '60%'
    // marginBottom: '60%'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#71717b',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  codeInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 24, 
    // shadowColor: '#000',
    // shadowOpacity: 0.04,
    // shadowRadius: 6,
    // elevation: 2,
    letterSpacing: 12,
    textAlign: 'center',
  },
  yourCodeContainer: {
    // backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 40,
    alignItems: 'center',
  },
  myCode: {
    fontSize: 27,
    fontWeight: '600',
    marginTop: 10,
  },
  innerContainer: {
    marginTop: 7,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
  }, 
  yourCodeLabel: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 5,
  }

});

export default AddFriendsScreen;