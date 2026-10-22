import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { MqttProvider } from '../src/context/MqttContext';
import { SensorProvider } from '../src/context/SensorContext';
import { AlertProvider } from '../src/context/AlertContext';
import { IPhoneFrame } from '../src/components/IPhoneFrame';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const fontId = 'google-font-industrial-editorial';
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;0,900;1,800&family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap';
        document.head.appendChild(link);

        const style = document.createElement('style');
        style.id = 'font-override-style';
        style.textContent = `
          * {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .font-display-condensed {
            font-family: 'Barlow Condensed', 'Bebas Neue', 'Impact', sans-serif !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MqttProvider>
          <SensorProvider>
            <AlertProvider>
              <IPhoneFrame>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="login"
                    options={{
                      presentation: 'modal',
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="wokwi-guide"
                    options={{
                      presentation: 'modal',
                      headerShown: false,
                    }}
                  />
                </Stack>
              </IPhoneFrame>
            </AlertProvider>
          </SensorProvider>
        </MqttProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
