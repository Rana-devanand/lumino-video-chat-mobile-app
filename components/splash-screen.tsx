import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

export function SplashScreen() {
  return (
    <View style={styles.container}>
      {/* Premium subtle gradient background */}
      {/* Premium blue and white gradient background */}
      <LinearGradient
        colors={['#E6F0FF', '#FFFFFF']}
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.content}>
        <View style={styles.lottieContainer}>
          <LottieView
            source={require('../assets/lottie/Video call.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>

        <Text style={styles.title}>Lumino</Text>
        <Text style={styles.tagline}>CONNECT INSTANTLY</Text>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width,
  },
  lottieContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#4440EB',
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#4440EB',
    letterSpacing: 4,
    fontWeight: '600',
    opacity: 0.9,
  },
  dotsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: -150, // Relative to content
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4440EB',
    opacity: 0.15,
  },
  activeDot: {
    width: 24, // Pill shape for active dot
    opacity: 1,
  },
});
