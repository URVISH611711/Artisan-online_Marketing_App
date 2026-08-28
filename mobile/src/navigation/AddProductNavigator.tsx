import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AddProductStackParamList } from './types';

import { CameraScreen } from '../screens/addProduct/CameraScreen';
import { AIStudioScreen } from '../screens/addProduct/AIStudioScreen';
import { VoiceScreen } from '../screens/addProduct/VoiceScreen';
import { ExtractionScreen } from '../screens/addProduct/ExtractionScreen';
import { ProcessingScreen } from '../screens/addProduct/ProcessingScreen';
import { CatalogScreen } from '../screens/addProduct/CatalogScreen';
import { PricingScreen } from '../screens/addProduct/PricingScreen';
import { ReviewScreen } from '../screens/addProduct/ReviewScreen';
import { SuccessScreen } from '../screens/addProduct/SuccessScreen';

const Stack = createNativeStackNavigator<AddProductStackParamList>();

export const AddProductNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="Camera" component={CameraScreen} />
    <Stack.Screen name="AIStudio" component={AIStudioScreen} />
    <Stack.Screen name="Voice" component={VoiceScreen} />
    <Stack.Screen name="Extraction" component={ExtractionScreen} />
    <Stack.Screen name="Processing" component={ProcessingScreen} />
    <Stack.Screen name="Catalog" component={CatalogScreen} />
    <Stack.Screen name="Pricing" component={PricingScreen} />
    <Stack.Screen name="Review" component={ReviewScreen} />
    <Stack.Screen name="Success" component={SuccessScreen} />
  </Stack.Navigator>
);
