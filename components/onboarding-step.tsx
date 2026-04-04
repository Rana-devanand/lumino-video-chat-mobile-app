import React from 'react';
import { StyleSheet, Text, View, Dimensions, Image } from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface OnboardingStepProps {
  image: any;
  badge: string;
  title: string;
  description: string;
}

export function OnboardingStep({ image, badge, title, description }: OnboardingStepProps) {
  return (
    <View style={styles.container}>
      {/* Image Container with Call UI Overlay */}
      <View style={styles.imageWrapper}>
        <Image source={image} style={styles.image} resizeMode="cover" />
        
        {/* Call UI Bubble Overlay */}
        <View style={styles.callOverlay}>
          <View style={styles.iconButton}>
            <Ionicons name="mic-outline" size={24} color="#000" />
          </View>
          <View style={[styles.iconButton, { backgroundColor: '#FF4B4B' }]}>
            <MaterialIcons name="call-end" size={24} color="#FFF" />
          </View>
          <View style={styles.iconButton}>
            <Ionicons name="videocam-outline" size={24} color="#000" />
          </View>
        </View>
      </View>

      <View style={styles.textContainer}>
        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge.toUpperCase()}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Description */}
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  imageWrapper: {
    width: width * 0.85,
    height: width * 0.65,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 40,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  callOverlay: {
    position: 'absolute',
    bottom: 20,
    left: '15%',
    right: '15%',
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 10,
    backdropFilter: 'blur(10px)', // For web/future support
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#E8E9FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    color: '#4440EB',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
});
