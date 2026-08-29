import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AddProductStackParamList } from './types';

import { CameraScreen } from '../screens/addProduct/CameraScreen';
import { ProductDetailsScreen } from '../screens/addProduct/ProductDetailsScreen';
import { BackgroundModeScreen } from '../screens/addProduct/BackgroundModeScreen';
import { AIStudioScreen } from '../screens/addProduct/AIStudioScreen';
import { VoiceScreen } from '../screens/addProduct/VoiceScreen';
import { ReviewScreen } from '../screens/addProduct/ReviewScreen';
import { SuccessScreen } from '../screens/addProduct/SuccessScreen';

const Stack = createNativeStackNavigator<AddProductStackParamList>();

export const AddProductNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="Camera" component={CameraScreen} />
    <Stack.Screen name="Voice" component={VoiceScreen} />
    <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
    <Stack.Screen name="BackgroundMode" component={BackgroundModeScreen} />
    <Stack.Screen name="AIStudio" component={AIStudioScreen} />
    <Stack.Screen name="Review" component={ReviewScreen} />
    <Stack.Screen name="Success" component={SuccessScreen} />
  </Stack.Navigator>
);
