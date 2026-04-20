import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LandingScreen from '../screens/auth/LandingScreen';
import OnboardingNavigator from './OnboardingNavigator';
import MainTabNavigator from './MainTabNavigator';
import MatchesScreen from '../screens/main/home/MatchesScreen';
import MatchInfoScreen from '../screens/main/home/MatchInfoScreen';
import TeamChatScreen from '../screens/main/teams/TeamChatScreen';
import UserProfileScreen from '../screens/main/profile/UserProfileScreen';
import TeamInfoScreen from '../screens/main/teams/TeamInfoScreen';
import AddPlayersScreen from '../screens/main/teams/AddPlayersScreen';
import SearchScreen from '../screens/main/home/SearchScreen';
import NotificationsScreen from '../screens/main/home/NotificationsScreen';
import SettingsScreen from '../screens/main/profile/SettingsScreen';
import EditProfileScreen from '../screens/main/profile/EditProfileScreen';
import EditNameScreen from '../screens/main/profile/EditNameScreen';
import EditAgeScreen from '../screens/main/profile/EditAgeScreen';
import AddNewSportScreen from '../screens/main/profile/AddNewSportScreen';
import NewSportSkillScreen from '../screens/main/profile/NewSportSkillScreen';
import UpdateSkillScreen from '../screens/main/profile/UpdateSkillScreen';
import TeamMatchesScreen from '../screens/main/teams/TeamMatchesScreen';
import TeamMatchInfoScreen from '../screens/main/teams/TeamMatchInfoScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }} 
        initialRouteName="Landing"
      >
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
        <Stack.Screen name="Matches" component={MatchesScreen} />
        <Stack.Screen name="MatchInfo" component={MatchInfoScreen} />
        <Stack.Screen name="TeamChat" component={TeamChatScreen} />
        <Stack.Screen name="UserProfileScreen" component={UserProfileScreen} />
        <Stack.Screen name="TeamInfo" component={TeamInfoScreen} />
        <Stack.Screen name="AddPlayers" component={AddPlayersScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen 
          name="EditProfile" 
          component={EditProfileScreen} 
          options={{
            presentation: 'formSheet',
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen name="EditName" component={EditNameScreen} />
        <Stack.Screen name="EditAge" component={EditAgeScreen} />
        <Stack.Screen name="AddNewSport" component={AddNewSportScreen} />
        <Stack.Screen name="NewSportSkill" component={NewSportSkillScreen} />
        <Stack.Screen name="UpdateSkill" component={UpdateSkillScreen} />
        <Stack.Screen name="TeamMatches" component={TeamMatchesScreen} />
        <Stack.Screen name="TeamMatchInfo" component={TeamMatchInfoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}