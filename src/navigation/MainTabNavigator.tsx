import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/main/home/HomeScreen';
import MatchScreen from '../screens/main/match/MatchScreen';
import TeamScreen from '../screens/main/teams/TeamScreen';
import ProfileScreen from '../screens/main/profile/ProfileScreen';
import { useColors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.backgroundPrimary,
          borderTopColor: colors.backgroundTertiary,
          borderTopWidth: 1,
          height: (Platform.OS === 'ios' ? 85 : 60) + insets.bottom,
          paddingBottom: (Platform.OS === 'ios' ? 25 : 10) + insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.systemGreen,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: colors.backgroundPrimary,
        },
        headerTitleStyle: {
          color: colors.textPrimary,
        },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
          title: 'Discover',
        }}
      />
      <Tab.Screen
        name="Match"
        component={MatchScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'football' : 'football-outline'} size={size} color={color} />
          ),
          title: 'Match',
        }}
      />
      <Tab.Screen
        name="Teams"
        component={TeamScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
          ),
          title: 'Teams',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}