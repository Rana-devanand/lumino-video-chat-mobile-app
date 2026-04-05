import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingStep } from '@/components/onboarding-step';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    id: '1',
    image: require('@/assets/onboard-image/video-call.jpg'),
    badge: 'lumino High-Def',
    title: 'Crystal Clear Video',
    description: "Experience high-definition video calls with minimal latency. We've optimized every frame for the most natural conversation.",
  },
  {
    id: '2',
    image: require('@/assets/onboard-image/meeting.jpg'),
    badge: 'Seamless Meetings',
    title: 'Professional Collaboration',
    description: "Host meetings with up to 100 participants. Share screens, recorded sessions, and collaborate in real-time with ease.",
  },
  {
    id: '3',
    image: require('@/assets/onboard-image/group.jpg'),
    badge: 'Global Connectivity',
    title: 'Connect Anywhere',
    description: "Our distributed server network ensures you stay connected with low latency, no matter where you are in the world.",
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);
  const router = useRouter();

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleSkip();
    }
  };

  const handleSkip = () => {
    // Navigate to the auth login screen
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#F8F9FB', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Skip Button Top Right */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main Carousel List */}
      <FlatList
        data={ONBOARDING_DATA}
        renderItem={({ item }) => (
          <OnboardingStep
            image={item.image}
            badge={item.badge}
            title={item.title}
            description={item.description}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />

      {/* Footer Fixed Section */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {ONBOARDING_DATA.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [10, 24, 10],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.2, 1, 0.2],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={i.toString()}
                style={[styles.dot, { width: dotWidth, opacity }]}
              />
            );
          })}
        </View>

        {/* Large Purple Button */}
        <TouchableOpacity onPress={handleNext} style={styles.nextButton} activeOpacity={0.8}>
          <Text style={styles.nextText}>{currentIndex === ONBOARDING_DATA.length - 1 ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>

        {/* Step Counter Footer */}
        <Text style={styles.stepText}>Step {currentIndex + 1} of 3</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 30,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4440EB',
  },
  nextButton: {
    backgroundColor: '#4440EB',
    width: '100%',
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4440EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  nextText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
});
