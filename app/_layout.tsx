import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
/*
const locales = getLocales();
const language = locales[0].languageCode;

i18n.load({ en, fi, sv })

if (language === "fi" || language === "sv" || language === "en") {
  i18n.activate(language);
} else {
  i18n.activate("en");
}
*/
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle={'dark-content'}/>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </GestureHandlerRootView>
  );
}
