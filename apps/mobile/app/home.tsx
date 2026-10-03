import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config';

export default function HomeScreen() {
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const token = await SecureStore.getItemAsync('jwt');
    if (!token) {
      router.replace('/');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        setUserName(user.preferredName || user.realName);
      } else {
        handleLogout();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('jwt');
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-6 py-4 flex-row justify-between items-center border-b border-gray-100 shadow-sm mt-8">
        <Text className="text-2xl font-bold text-blue-600">CampusCart</Text>
        <TouchableOpacity onPress={handleLogout} className="bg-gray-100 px-4 py-2 rounded-lg active:bg-gray-200">
          <Text className="text-gray-700 font-bold text-sm">Sign Out</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView className="flex-1 p-6">
        <View className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
          <Text className="text-3xl font-bold text-gray-800 mb-3">Welcome back,</Text>
          <Text className="text-4xl font-black text-blue-600 mb-6">{userName}! 👋</Text>
          <Text className="text-gray-600 text-lg leading-6">Your mobile CampusCart dashboard is ready. Let's start buying and selling on campus.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
