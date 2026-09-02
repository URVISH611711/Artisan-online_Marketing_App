import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { layout, shadows } from '../theme/spacing';
import { rs, rf } from '../theme/responsive';
import { MainTabParamList, HomeStackParamList, ProductsStackParamList, OrdersStackParamList, SalesStackParamList, ProfileStackParamList } from './types';

// Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { AddProductNavigator } from './AddProductNavigator';
import { SmartPricePickerScreen } from '../screens/pricing/SmartPricePickerScreen';
import { SmartPriceAnalysisScreen } from '../screens/pricing/SmartPriceAnalysisScreen';

import { ProductsScreen } from '../screens/products/ProductsScreen';
import { ProductDetailScreen } from '../screens/products/ProductDetailScreen';
import { EditProductScreen } from '../screens/products/EditProductScreen';
import { BoostProductScreen } from '../screens/products/BoostProductScreen';
import { BuyerProductScreen } from '../screens/marketplace/BuyerProductScreen';
import { CartScreen } from '../screens/marketplace/CartScreen';
import { CheckoutScreen } from '../screens/marketplace/CheckoutScreen';

import { OrdersScreen } from '../screens/orders/OrdersScreen';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import { BulkOrderScreen } from '../screens/orders/BulkOrderScreen';
import { CounterOfferScreen } from '../screens/orders/CounterOfferScreen';

import { SalesScreen } from '../screens/sales/SalesScreen';
import { InsightsScreen } from '../screens/sales/InsightsScreen';

import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';

// Stack navigators for each tab
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProductsStack = createNativeStackNavigator<ProductsStackParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const SalesStack = createNativeStackNavigator<SalesStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const HomeStackScreen = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeMain" component={HomeScreen} />
    <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    <HomeStack.Screen name="AddProduct" component={AddProductNavigator} />
    <HomeStack.Screen name="SmartPricePicker" component={SmartPricePickerScreen} />
    <HomeStack.Screen name="SmartPriceAnalysis" component={SmartPriceAnalysisScreen} />
  </HomeStack.Navigator>
);

const ProductsStackScreen = () => (
  <ProductsStack.Navigator screenOptions={{ headerShown: false }}>
    <ProductsStack.Screen name="ProductsList" component={ProductsScreen} />
    <ProductsStack.Screen name="ProductDetail" component={ProductDetailScreen} />
    <ProductsStack.Screen name="EditProduct" component={EditProductScreen} />
    <ProductsStack.Screen name="BoostProduct" component={BoostProductScreen} />
    <ProductsStack.Screen name="BuyerProduct" component={BuyerProductScreen as any} />
    <ProductsStack.Screen name="Cart" component={CartScreen} />
    <ProductsStack.Screen name="Checkout" component={CheckoutScreen} />
    <ProductsStack.Screen name="SmartPriceAnalysis" component={SmartPriceAnalysisScreen} />
  </ProductsStack.Navigator>
);

const OrdersStackScreen = () => (
  <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
    <OrdersStack.Screen name="OrdersList" component={OrdersScreen} />
    <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} />
    <OrdersStack.Screen name="BulkOrder" component={BulkOrderScreen} />
    <OrdersStack.Screen name="CounterOffer" component={CounterOfferScreen} />
  </OrdersStack.Navigator>
);

const SalesStackScreen = () => (
  <SalesStack.Navigator screenOptions={{ headerShown: false }}>
    <SalesStack.Screen name="SalesMain" component={SalesScreen} />
    <SalesStack.Screen name="Insights" component={InsightsScreen} />
  </SalesStack.Navigator>
);

const ProfileStackScreen = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    <ProfileStack.Screen name="Settings" component={SettingsScreen} />
  </ProfileStack.Navigator>
);

// Custom tab bar icon with label
interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
  badge?: number;
}

const TabIcon: React.FC<TabIconProps> = ({ name, focused, label, badge }) => (
  <View style={tabStyles.iconWrapper}>
    <View style={[tabStyles.iconContainer, focused && tabStyles.iconContainerActive]}>
      <Ionicons
        name={focused ? name : `${name}-outline` as keyof typeof Ionicons.glyphMap}
        size={22}
        color={focused ? colors.primary : colors.tabInactive}
      />
    </View>
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.75}
      style={[tabStyles.label, focused && tabStyles.labelActive]}
    >
      {label}
    </Text>
    {badge != null && badge > 0 && (
      <View style={tabStyles.badge}>
        <Text style={tabStyles.badgeText}>{badge}</Text>
      </View>
    )}
  </View>
);

export const MainTabNavigator: React.FC<{ onMicPress?: () => void }> = () => {
  const insets = useSafeAreaInsets();
  // Dynamic tab bar height: base + safe area bottom inset (for Android gesture nav / iPhone home bar)
  const tabBarHeight = rs(58) + insets.bottom;

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: [
            tabStyles.tabBar,
            {
              height: tabBarHeight,
              paddingBottom: insets.bottom > 0 ? insets.bottom : rs(6),
            }
          ],
          tabBarItemStyle: tabStyles.tabBarItem,
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStackScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} label="Home" />,
          }}
        />
        <Tab.Screen
          name="Products"
          component={ProductsStackScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="grid" focused={focused} label="Products" />,
          }}
        />
        <Tab.Screen
          name="Orders"
          component={OrdersStackScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="receipt" focused={focused} label="Orders" />,
          }}
        />
        <Tab.Screen
          name="Sales"
          component={SalesStackScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="bar-chart" focused={focused} label="Sales" />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStackScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} label="Profile" />,
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

const tabStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 0,
    ...shadows.bottomNav,
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
    paddingHorizontal: 1,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 2,
    position: 'relative',
  },
  iconContainer: {
    width: 40,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconContainerActive: {
    backgroundColor: '#EBF5FF',
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    color: colors.tabInactive,
    textAlign: 'center',
    fontWeight: '500',
    width: '100%',
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 4,
    backgroundColor: colors.secondary,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});
