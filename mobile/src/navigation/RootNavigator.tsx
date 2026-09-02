import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAuthStore } from '../store/useAuthStore';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { registerForPushNotificationsAsync } from '../services/pushNotifications';
import { BuyerHomeScreen } from '../screens/marketplace/BuyerHomeScreen';
import { SearchResultsScreen } from '../screens/marketplace/SearchResultsScreen';
import { BuyerProductScreen } from '../screens/marketplace/BuyerProductScreen';
import { ArtisanProfileScreen } from '../screens/marketplace/ArtisanProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, fetchAndSetProfile } = useAuthStore();
  const [aiVisible, setAiVisible] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchAndSetProfile();
      registerForPushNotificationsAsync();
    }
  }, [isAuthenticated, fetchAndSetProfile]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main">
            {() => <MainTabNavigator onMicPress={() => setAiVisible(true)} />}
          </Stack.Screen>
          <Stack.Group>
            <Stack.Screen name="Marketplace" component={MarketplaceStackScreen} />
          </Stack.Group>
        </>
      )}
    </Stack.Navigator>
  );
};

// Marketplace stack (nested inline for brevity)
import { createNativeStackNavigator as createStack } from '@react-navigation/native-stack';
import { MarketplaceStackParamList } from './types';

const MStack = createStack<MarketplaceStackParamList>();

const MarketplaceStackScreen = () => (
  <MStack.Navigator screenOptions={{ headerShown: false }}>
    <MStack.Screen name="BuyerHome" component={BuyerHomeScreen} />
    <MStack.Screen name="SearchResults" component={SearchResultsScreen} />
    <MStack.Screen name="BuyerProduct" component={BuyerProductScreen} />
    <MStack.Screen name="ArtisanProfile" component={ArtisanProfileScreen} />
  </MStack.Navigator>
);
