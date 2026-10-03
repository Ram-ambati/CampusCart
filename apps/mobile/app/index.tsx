import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config';

// Required for WebBrowser to work properly on Android
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();

  useEffect(() => {
    // Check if we already have a token saved
    SecureStore.getItemAsync('jwt').then(token => {
      if (token) {
        checkOnboardingStatus(token);
      }
    });
  }, []);

  const checkOnboardingStatus = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        if (user.onboardingCompleted) {
          router.replace('/home');
        } else {
          router.replace('/onboarding');
        }
      } else {
        await SecureStore.deleteItemAsync('jwt');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGoogleLogin = async () => {
    // This generates a deep link back to this exact app (e.g., exp://192.168.1.100:8081/--/login)
    const redirectUrl = Linking.createURL('/login');
    
    // Hit the dynamic backend endpoint that saves the redirect URI in a cookie,
    // then fires the standard Spring Security Google OAuth2 flow.
    const authUrl = `${API_BASE_URL}/auth/mobile-login?redirect_uri=${encodeURIComponent(redirectUrl)}`;

    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      
      if (result.type === 'success' && result.url) {
        // Parse the token from the deep link URL returned by Spring Boot
        const parsedUrl = Linking.parse(result.url);
        const token = parsedUrl.queryParams?.token as string;
        
        if (token) {
          await SecureStore.setItemAsync('jwt', token);
          checkOnboardingStatus(token);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-gray-50 p-8">
      <View className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-sm items-center border border-gray-100">
        <Text className="text-4xl font-bold text-blue-600 mb-2">CampusCart</Text>
        <Text className="text-gray-500 mb-8 text-base">Exclusive to @anurag.edu.in</Text>
        
        <TouchableOpacity 
          onPress={handleGoogleLogin}
          className="w-full flex-row items-center justify-center gap-3 bg-white border border-gray-300 rounded-xl px-4 py-4 active:bg-gray-50"
        >
          <Image 
            source={{ uri: 'https://www.svgrepo.com/show/475656/google-color.svg' }} 
            className="w-6 h-6" 
          />
          <Text className="text-gray-700 font-bold text-lg">Continue with Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
