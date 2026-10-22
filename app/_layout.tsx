import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { MqttProvider } from '../src/context/MqttContext';
import { SensorProvider } from '../src/context/SensorContext';
import { AlertProvider } from '../src/context/AlertContext';
import { IPhoneFrame } from '../src/components/IPhoneFrame';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
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
