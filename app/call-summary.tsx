import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CallSummaryScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brandName}>lumino</Text>
        <Image source={{ uri: 'https://i.pravatar.cc/150?u=sarah' }} style={styles.userAvatar} />
      </View>

      {/* Main Content inside Card */}
      <View style={styles.summaryCard}>

        {/* Large icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="videocam-off" size={48} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>Call Ended</Text>

        <View style={styles.durationBadge}>
          <Ionicons name="time" size={16} color="#4B5563" />
          <Text style={styles.durationText}>Call duration: 15:20</Text>
        </View>

        {/* Recipient Card */}
        <View style={styles.recipientCard}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?u=elena' }} style={styles.recipientAvatar} />
          <View style={styles.recipientInfo}>
            <Text style={styles.recipientLabel}>RECIPIENT</Text>
            <Text style={styles.recipientName}>Elena Fisher</Text>
          </View>
          <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
        </View>

        {/* Buttons */}
        <Pressable style={styles.primaryButton} onPress={() => router.push('/room')}>
          <Ionicons name="call" size={20} color="#FFFFFF" style={styles.btnIcon} />
          <Text style={styles.primaryButtonText}>Call Again</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </Pressable>

        {/* Rating */}
        <Text style={styles.ratingTitle}>RATE THE QUALITY</Text>
        <View style={styles.ratingContainer}>
          <Pressable style={styles.ratingBtn}>
            <Ionicons name="thumbs-down" size={24} color="#4B5563" />
          </Pressable>
          <Pressable style={[styles.ratingBtn, { marginLeft: 16 }]}>
            <Ionicons name="thumbs-up" size={24} color="#4B5563" />
          </Pressable>
        </View>

      </View>

      {/* Footer Text */}
      <Text style={styles.footerText}>
        The recording and summary will be available in your <Text style={styles.linkText}>History</Text> shortly.
      </Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
    letterSpacing: -0.5,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 32,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 8,
  },
  recipientCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  recipientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    borderRadius: 28,
    marginBottom: 16,
  },
  btnIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    borderRadius: 28,
    marginBottom: 40,
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  ratingTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  ratingBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  linkText: {
    color: '#4F46E5',
    fontWeight: 'bold',
  }
});
