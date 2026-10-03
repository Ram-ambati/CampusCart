import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config';

export default function OnboardingScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    preferredName: '',
    phoneNumber: '',
    branch: '',
    academicYear: ''
  });

  const handleSubmit = async () => {
    if (!formData.preferredName || !formData.phoneNumber || !formData.branch || !formData.academicYear) {
      Alert.alert('Missing Info', 'Please fill out all fields.');
      return;
    }

    const token = await SecureStore.getItemAsync('jwt');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        router.replace('/home');
      } else {
        Alert.alert('Error', 'Failed to save details. Please try again.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Network Error', 'Could not connect to server.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <ScrollView contentContainerClassName="flex-grow justify-center p-6">
        <View className="bg-white p-8 rounded-2xl shadow-sm w-full border border-gray-100">
          <Text className="text-3xl font-bold text-gray-800 text-center mb-6">Welcome!</Text>
          <Text className="text-gray-500 text-center mb-8 text-base">Let's get set up before you start exploring CampusCart.</Text>
          
          <View className="space-y-5 flex flex-col gap-4">
            <View>
              <Text className="text-sm font-bold text-gray-700 mb-2">Preferred Name</Text>
              <TextInput 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-800"
                placeholder="What should we call you?"
                value={formData.preferredName}
                onChangeText={t => setFormData({...formData, preferredName: t})}
              />
            </View>

            <View>
              <Text className="text-sm font-bold text-gray-700 mb-2">Phone Number</Text>
              <TextInput 
                keyboardType="phone-pad"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-800"
                placeholder="For coordinating deliveries"
                value={formData.phoneNumber}
                onChangeText={t => setFormData({...formData, phoneNumber: t})}
              />
            </View>

            <View>
              <Text className="text-sm font-bold text-gray-700 mb-2">Branch</Text>
              <TextInput 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-800"
                placeholder="e.g. CSE, IT, ECE"
                value={formData.branch}
                onChangeText={t => setFormData({...formData, branch: t})}
              />
            </View>

            <View>
              <Text className="text-sm font-bold text-gray-700 mb-2">Academic Year</Text>
              <TextInput 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-800"
                placeholder="e.g. 1st, 2nd, 3rd, 4th"
                value={formData.academicYear}
                onChangeText={t => setFormData({...formData, academicYear: t})}
              />
            </View>
            
            <TouchableOpacity 
              onPress={handleSubmit}
              className="w-full bg-blue-600 rounded-xl px-4 py-4 mt-6 active:bg-blue-700"
            >
              <Text className="text-white text-center font-bold text-lg">Complete Setup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
