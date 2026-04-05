import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator, MaterialTopTabNavigationOptions } from '@react-navigation/material-top-tabs';
import * as React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { videoCallService } from '@/services/videoCallService';
import { authService } from '@/services/authService';
import { soundService } from '@/services/soundService';

const { Navigator } = createMaterialTopTabNavigator();
const MaterialTopTabs = withLayoutContext(Navigator);

// ─── Responsive helpers ────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');

// Horizontal margin: 5% on each side, min 16px, max 32px
const TAB_MARGIN = Math.min(Math.max(SCREEN_W * 0.05, 16), 32);
// Width available for the tab bar pill
const TAB_BAR_W  = SCREEN_W - TAB_MARGIN * 2;
// Each tab gets an equal share; icon + label must fit
const TAB_W      = TAB_BAR_W / 5;           // 5 tabs
const ICON_SIZE  = TAB_W < 64 ? 18 : 22;   // shrink icon on tiny screens
const LABEL_SIZE = TAB_W < 64 ? 9  : 11;   // shrink label on tiny screens

export default function TabLayout() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  // Height: icon (ICON_SIZE) + padding + label + safe area bottom
  // Minimum 60, comfortable 72-80
  const TAB_H = Math.max(60, ICON_SIZE + 8 + LABEL_SIZE + 16 + insets.bottom);

  React.useEffect(() => {
    const setupListener = async () => {
      const user = await authService.getCurrentUser();
      if (!user) return;

      const channel = videoCallService.listenForIncomingCalls(user.id, (room) => {
        soundService.playRingtone();
        router.push({
          pathname: '/room',
          params: { roomId: room.id, mode: 'callee', name: 'Inbound Call' },
        });
      });

      return channel;
    };

    let activeChannel: any;
    setupListener().then(ch => { activeChannel = ch; });

    return () => {
      if (activeChannel) videoCallService.removeChannel(activeChannel);
      soundService.stopAll();
    };
  }, []);

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
          tabBarBounces: false,          // prevent horizontal rubberbanding
          tabBarScrollEnabled: false,    // ← NO horizontal scroll — all tabs fit
          tabBarStyle: {
            position: 'absolute',
            bottom: Math.max(insets.bottom, 8),
            left: TAB_MARGIN,
            right: TAB_MARGIN,
            width: TAB_BAR_W,           // explicit width to prevent stretch
            height: TAB_H,
            borderRadius: 36,
            backgroundColor: '#1C1C1E',
            borderTopWidth: 0,
            elevation: 15,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            overflow: 'hidden',         // clip any accidental overflow
          },
          // Each tab item fills exactly 1/5 of the bar — no more, no less
          tabBarItemStyle: {
            width: TAB_W,
            height: TAB_H,
            paddingHorizontal: 0,
            paddingVertical: 0,
            justifyContent: 'center',
            alignItems: 'center',
          },
          tabBarContentContainerStyle: {
            flexDirection: 'row',
            flex: 1,
          },
        }}
      >
        <MaterialTopTabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabItem
                name={focused ? 'home' : 'home-outline'}
                title="Home"
                focused={focused}
                tabW={TAB_W}
                iconSize={ICON_SIZE}
                labelSize={LABEL_SIZE}
              />
            ),
          }}
        />
        <MaterialTopTabs.Screen
          name="chat"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabItem
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                title="Chat"
                focused={focused}
                tabW={TAB_W}
                iconSize={ICON_SIZE}
                labelSize={LABEL_SIZE}
              />
            ),
          }}
        />
        <MaterialTopTabs.Screen
          name="groups"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabItem
                name={focused ? 'people' : 'people-outline'}
                title="Groups"
                focused={focused}
                tabW={TAB_W}
                iconSize={ICON_SIZE}
                labelSize={LABEL_SIZE}
              />
            ),
          }}
        />
        <MaterialTopTabs.Screen
          name="status"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabItem
                name={focused ? 'aperture' : 'aperture-outline'}
                title="Status"
                focused={focused}
                tabW={TAB_W}
                iconSize={ICON_SIZE}
                labelSize={LABEL_SIZE}
              />
            ),
          }}
        />
        <MaterialTopTabs.Screen
          name="history"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabItem
                name={focused ? 'time' : 'time-outline'}
                title="History"
                focused={focused}
                tabW={TAB_W}
                iconSize={ICON_SIZE}
                labelSize={LABEL_SIZE}
              />
            ),
          }}
        />
      </MaterialTopTabs>
    </>
  );
}

// ─── Responsive Tab Item ───────────────────────────────────────────────────────
type TabItemProps = {
  name: any;
  title: string;
  focused: boolean;
  tabW: number;
  iconSize: number;
  labelSize: number;
};

const TabItem = ({ name, title, focused, tabW, iconSize, labelSize }: TabItemProps) => (
  <View style={[itemStyles.wrap, { width: tabW }]}>
    <View style={[itemStyles.iconWrap, focused && itemStyles.activeWrap]}>
      <Ionicons
        name={name}
        size={iconSize}
        color={focused ? '#818CF8' : '#9CA3AF'}
      />
    </View>
    <Text
      style={[
        itemStyles.label,
        focused && itemStyles.activeLabel,
        { fontSize: labelSize },
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.7}
    >
      {title}
    </Text>
  </View>
);

const itemStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    // No fixed height — let parent tabBarItemStyle control it
  },
  iconWrap: {
    padding: 5,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
    minHeight: 32,
  },
  activeWrap: {
    backgroundColor: 'rgba(129,140,248,0.15)',
  },
  label: {
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 3,
    textAlign: 'center',
  },
  activeLabel: {
    color: '#818CF8',
  },
});
