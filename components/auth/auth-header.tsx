import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

interface AuthHeaderProps {
  type: 'login' | 'verify';
}

export function AuthHeader({ type }: AuthHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        {type === 'login' ? (
          <FontAwesome5 name="mobile-alt" size={40} color="#4440EB" />
        ) : (
          <MaterialCommunityIcons name="sim" size={40} color="#4440EB" />
        )}
        <View style={styles.lockOverlay}>
           <FontAwesome5 name="lock" size={12} color="#FFF" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 30,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -7 }, { translateY: -7 }],
    backgroundColor: '#4440EB',
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
});
