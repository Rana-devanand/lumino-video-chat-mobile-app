import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator, MaterialTopTabNavigationOptions } from '@react-navigation/material-top-tabs';
import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { Navigator } = createMaterialTopTabNavigator();
const MaterialTopTabs = withLayoutContext(Navigator);

export default function TabLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="#F8F9FA" />
      <MaterialTopTabs
        tabBarPosition="bottom"
        screenOptions={{
          swipeEnabled: true,
          tabBarShowLabel: false,
          tabBarShowIcon: true,
          tabBarIndicatorStyle: { display: 'none' },
          tabBarPressColor: 'transparent',
          tabBarStyle: {
            position: 'absolute',
            bottom: 8,
            left: 24,
            right: 24,
            height: 80,
            borderRadius: 36,
            backgroundColor: '#1C1C1E',
            borderTopWidth: 0,
            elevation: 15,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 15,
            paddingTop: 8,
            paddingBottom: 8,
            paddingHorizontal: 8,
            justifyContent: 'center',
          },
        }}>
        <MaterialTopTabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => <TabBarIcon name={focused ? "home" : "home-outline"} title="HOME" focused={focused} />,
          }}
        />
        <MaterialTopTabs.Screen
          name="chat"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => <TabBarIcon name={focused ? "chatbubbles" : "chatbubbles-outline"} title="CHAT" focused={focused} />,
          }}
        />
        <MaterialTopTabs.Screen
          name="contacts"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => <TabBarIcon name={focused ? "people" : "people-outline"} title="CONTACTS" focused={focused} />,
          }}
        />
        <MaterialTopTabs.Screen
          name="status"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => <TabBarIcon name={focused ? "aperture" : "aperture-outline"} title="STATUS" focused={focused} />,
          }}
        />
        <MaterialTopTabs.Screen
          name="history"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => <TabBarIcon name={focused ? "time" : "time-outline"} title="HISTORY" focused={focused} />,
          }}
        />
      </MaterialTopTabs>
    </>
  );
}

const TabBarIcon = ({ name, title, focused }: { name: any, title: string, focused: boolean }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
        <Ionicons name={name} size={22} color={focused ? '#818CF8' : '#9CA3AF'} />
      </View>
      <Text style={[styles.label, focused && styles.activeLabel]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 65,
    marginTop: -8, // Pull slightly up to center in top-tabs
  },
  iconWrapper: {
    padding: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconWrapper: {
    backgroundColor: 'rgba(129, 140, 248, 0.15)', // Subtle glow background
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    color: '#9CA3AF',
  },
  activeLabel: {
    color: '#818CF8', // Brighter indigo that pops on dark mode
  }
});
