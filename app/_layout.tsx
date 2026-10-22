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
      const fontId = 'google-font-bungee-bebas';
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Bungee&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap';
        document.head.appendChild(link);

        const style = document.createElement('style');
        style.id = 'font-override-style';
        style.textContent = `
          * {
            font-family: 'Bebas Neue', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          .font-heading {
            font-family: 'Bungee', cursive, sans-serif !important;
          }
          .font-content {
            font-family: 'Bebas Neue', sans-serif !important;
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
