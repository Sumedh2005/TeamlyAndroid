import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/fonts';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';

const { width } = Dimensions.get('window');

const slides = [
  { id: 1, image: require('../../assets/landing1.png') },
  { id: 2, image: require('../../assets/landing2.png') },
  { id: 3, image: require('../../assets/landing3.png') },
];

type ModalType = 'none' | 'login' | 'signup';

export default function LandingScreen({ navigation }: any) {
  const colors = useColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % slides.length;
      scrollRef.current?.scrollTo({ x: nextIndex * (width - 32), animated: true });
      setActiveIndex(nextIndex);
    }, 2500);
    return () => clearInterval(interval);
  }, [activeIndex]);

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (width - 32));
    setActiveIndex(index);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    slideContainer: {
      marginTop: 60,
      height: 200,
      paddingHorizontal: 24,
    },
    slide: {
      width: width - 48,
      height: 200,
      marginHorizontal: 8,
      borderRadius: 20,
      overflow: 'hidden',
    },
    slideImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
      borderRadius: 20,
    },
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    textContainer: {
      flex: 1,
      alignItems: 'center',
      marginTop: 28,
    },
    title: {
      fontSize: 40,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginTop: 4,
    },
    bottomContainer: {
      paddingHorizontal: 24,
      paddingBottom: 48,
      alignItems: 'center',
    },
    divider: {
      width: '100%',
      height: 0.5,
      backgroundColor: colors.backgroundQuaternary,
      marginBottom: 20,
    },
    bottomText: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.regular,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    button: {
      width: '100%',
      height: 56,
      backgroundColor: colors.systemGreen,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.semiBold,
      color: colors.primaryWhite,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContainer: {
      backgroundColor: colors.backgroundPrimary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />

      {/* Green tint gradient at top */}
      <LinearGradient
        colors={['rgba(52, 199, 89, 0.18)', 'rgba(52, 199, 89, 0)']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 150,
          zIndex: 0,
        }}
      />

      {/* Sliding Banners */}
      <View style={styles.slideContainer}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          snapToInterval={width - 32}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 0 }}
        >
          {slides.map((slide) => (
            <View key={slide.id} style={styles.slide}>
              <Image source={slide.image} style={styles.slideImage} />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === activeIndex ? colors.systemGreen : colors.backgroundQuaternary,
                width: index === activeIndex ? 10 : 8,
                height: index === activeIndex ? 10 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Title */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>Teamly</Text>
        <Text style={styles.subtitle}>From chaos to kickoff!</Text>
      </View>

      {/* Bottom */}
      <View style={styles.bottomContainer}>
        <View style={styles.divider} />
        <Text style={styles.bottomText}>Create your account and start playing!</Text>
        <TouchableOpacity style={styles.button} onPress={() => setActiveModal('login')}>
          <Text style={styles.buttonText}>Let's Start</Text>
        </TouchableOpacity>
      </View>

      {/* Login Modal */}
<Modal
  visible={activeModal === 'login'}
  animationType="slide"
  transparent
  onRequestClose={() => setActiveModal('none')}
>
  <TouchableWithoutFeedback onPress={() => setActiveModal('none')}>
    <View style={styles.modalOverlay}>
      <TouchableWithoutFeedback>
        <View style={styles.modalContainer}>
          <LoginScreen
            onClose={() => setActiveModal('none')}
            onSwitchToSignup={() => setActiveModal('signup')}
            onLoginSuccess={(isOnboardingComplete) => {
              setActiveModal('none');
              if (isOnboardingComplete) {
                navigation.navigate('MainApp'); 
              } else {
                navigation.navigate('Onboarding');
              }
            }}
          />
        </View>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
</Modal>

{/* Signup Modal */}
<Modal
  visible={activeModal === 'signup'}
  animationType="slide"
  transparent
  onRequestClose={() => setActiveModal('none')}
>
  <TouchableWithoutFeedback onPress={() => setActiveModal('none')}>
    <View style={styles.modalOverlay}>
      <TouchableWithoutFeedback>
        <View style={styles.modalContainer}>
          <RegisterScreen
            onClose={() => setActiveModal('none')}
            onSwitchToLogin={() => setActiveModal('login')}
            onSignUpSuccess={() => {
              setActiveModal('none');
              navigation.navigate('Onboarding'); // new users always go to onboarding
            }}
          />
        </View>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
</Modal>
    </View>
  );
}