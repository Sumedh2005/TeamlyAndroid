import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NameAndDetailsScreen from '../screens/onboarding/profileSetup/NameAndDetailsScreen';
import AgeScreen from '../screens/onboarding/profileSetup/AgeScreen';
import SportSelectionScreen from '../screens/onboarding/profileSetup/SportSelectionScreen';
import SkillLevelScreen from '../screens/onboarding/profileSetup/SkillLevelScreen';
import AvatarSelectScreen from '../screens/onboarding/profileSetup/AvatarSelectScreen';
import SearchingCommunitiesScreen from '../screens/onboarding/searchingCommunities/SearchingCommunitiesScreen';
import CollegeVerificationScreen from '../screens/onboarding/collegeVerification/CollegeVerificationScreen';
import CollegeVerificationStep2Screen from '../screens/onboarding/collegeVerification/CollegeVerificationStep2Screen';

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NameAndDetails" component={NameAndDetailsScreen} />
      <Stack.Screen name="Age" component={AgeScreen} />
      <Stack.Screen name="SportSelection" component={SportSelectionScreen} />
      <Stack.Screen name="SkillLevel" component={SkillLevelScreen} />
      <Stack.Screen name="AvatarSelect" component={AvatarSelectScreen} />
      <Stack.Screen name="SearchingCommunities" component={SearchingCommunitiesScreen} />
      <Stack.Screen name="CollegeVerification" component={CollegeVerificationScreen} />
      <Stack.Screen name="CollegeVerificationStep2" component={CollegeVerificationStep2Screen} />
    </Stack.Navigator>
  );
}