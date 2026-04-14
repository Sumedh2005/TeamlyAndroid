import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LandingScreen from '../screens/auth/LandingScreen';
import OnboardingNavigator from './OnboardingNavigator';
import MainTabNavigator from './MainTabNavigator';
import MatchesScreen from '../screens/main/home/MatchesScreen';
import MatchInfoScreen from '../screens/main/home/MatchInfoScreen';
import TeamChatScreen from '../screens/main/teams/TeamChatScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Landing">
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
        <Stack.Screen name="Matches" component={MatchesScreen} />
        <Stack.Screen name="MatchInfo" component={MatchInfoScreen} />
        <Stack.Screen name="TeamChat" component={TeamChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}