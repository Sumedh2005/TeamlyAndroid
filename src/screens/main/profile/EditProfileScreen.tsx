import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useColors } from '../../../theme/colors';
import { FontFamily } from '../../../theme/fonts';
import ProfileManager from '../../../services/ProfileManager';
import UserProfileManager, { Profile } from '../../../services/UserProfileManager';

// Helper component for List Cells matching the Swift design
const EditRowCell = ({ title, onPress, isDarkMode, colors, hasBorder }: any) => (
  <View>
    <TouchableOpacity
      style={styles.cell}
      activeOpacity={0.5}
      onPress={onPress}
    >
      <Text style={[styles.cellTitle, { color: isDarkMode ? colors.primaryWhite : colors.primaryBlack }]}>
        {title}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} />
    </TouchableOpacity>
    {hasBorder && (
      <View style={[styles.separator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
    )}
  </View>
);

export default function EditProfileScreen({ navigation, route }: any) {
  const colors = useColors();
  const isDarkMode = colors.backgroundPrimary === '#000000' || colors.backgroundPrimary === '#121212';
  
  // Params inherited from Settings -> Profile
  const { currentUserId } = route.params || {};

  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [sportsList, setSportsList] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (currentUserId) {
        UserProfileManager.fetchProfile(currentUserId).then((data) => {
          setProfileData(data);
          setAvatarUri(data?.profile_pic || null);
        });
        UserProfileManager.fetchSports(currentUserId).then(sports => setSportsList(sports));
      }
    }, [currentUserId])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  // Image Picker Logic securely mimicking iOS upload configurations
  const handleEditAvatar = async () => {
    Alert.alert(
      "Change Profile Picture",
      "",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert("Permission Required", "Camera access is needed.");
              return;
            }
            launchPicker(true);
          }
        },
        {
          text: "Choose from Library",
          onPress: async () => {
             const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
             if (status !== 'granted') {
               Alert.alert("Permission Required", "Gallery access is needed.");
               return;
             }
             launchPicker(false);
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const launchPicker = async (useCamera: boolean) => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // perfectly square exactly mapping Swift bounds
      quality: 0.8,
    };

    let result;
    if (useCamera) {
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;
      uploadAvatarImage(selectedUri);
    }
  };

  const uploadAvatarImage = async (uri: string) => {
    if (!currentUserId) {
      Alert.alert("Error", "User ID not found.");
      return;
    }

    setIsLoading(true);

    try {
      // Direct call into our backend storage service porting ProfileManager.swift 1:1
      const publicUrl = await ProfileManager.uploadProfilePicture(currentUserId, uri);
      
      setAvatarUri(publicUrl);
    } catch (error: any) {
      Alert.alert(
        "Upload Failed",
        error?.message || "Failed to upload profile picture. Would you like to try again?",
        [
          { text: "Try Again", onPress: () => uploadAvatarImage(uri) },
          { text: "Cancel", style: "cancel" }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Navigators
  const handleEditName = () => navigation.navigate('EditName', { currentName: profileData?.name, currentUserId });
  const handleEditAge = () => navigation.navigate('EditAge', { currentAge: profileData?.age, currentUserId });
  const handleAddSport = () => {
    const existingSportIds = sportsList.map(s => s.id);
    navigation.navigate('AddNewSport', { existingSportIds, currentUserId });
  };
  const handleUpdateSkillLevel = () => {
    if (sportsList.length === 0) {
      Alert.alert("No Sports", "Please add a sport first.");
      return;
    }
    navigation.navigate('UpdateSkill', { sports: sportsList, currentUserId });
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={handleBack} 
      />
      <View style={[
        styles.sheetContent, 
        { 
          backgroundColor: isDarkMode ? '#1C1C1E' : '#F2F2F7',
          paddingBottom: Math.max(insets.bottom, 20) + 20
        }
      ]}>
        <View style={styles.dragIndicatorWrapper}>
          <View style={styles.dragIndicator} />
        </View>

        {/* Central Identity Graphic Wrapper */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={[
               styles.avatarButton, 
               { backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E5EA', borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }
            ]}
            onPress={handleEditAvatar}
            disabled={isLoading}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons 
                name="person" 
                size={55} 
                color={isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'} 
              />
            )}
            
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleEditAvatar} disabled={isLoading}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Action Panel Array */}
        <View style={styles.optionsContainerWrapper}>
          <View style={[
            styles.optionsContainer, 
            { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' }
          ]}>
            <EditRowCell title="Edit Name" onPress={handleEditName} isDarkMode={isDarkMode} colors={colors} hasBorder={true} />
            <EditRowCell title="Edit Age" onPress={handleEditAge} isDarkMode={isDarkMode} colors={colors} hasBorder={true} />
            <EditRowCell title="Add Sport" onPress={handleAddSport} isDarkMode={isDarkMode} colors={colors} hasBorder={true} />
            <EditRowCell title="Update Skill level" onPress={handleUpdateSkillLevel} isDarkMode={isDarkMode} colors={colors} hasBorder={false} />
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetContent: {
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    overflow: 'hidden',
  },
  dragIndicatorWrapper: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(150, 150, 150, 0.4)',
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  avatarButton: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editText: {
    marginTop: 10,
    fontSize: 17,
    fontFamily: FontFamily.semiBold,
    color: '#34C759',
  },
  optionsContainerWrapper: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 32,
  },
  optionsContainer: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  cell: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingRight: 15,
  },
  cellTitle: {
    fontSize: 17,
    fontFamily: FontFamily.regular,
  },
  separator: {
    height: 0.5,
    marginLeft: 20,
  }
});
