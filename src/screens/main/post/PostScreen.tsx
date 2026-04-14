import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import PostManager from './PostManager';

const SPORTS = [
  { id: 'football', emoji: '⚽', label: 'Football' },
  { id: 'basketball', emoji: '🏀', label: 'Basketball' },
  { id: 'cricket', emoji: '🏏', label: 'Cricket' },
  { id: 'tabletennis', emoji: '🏓', label: 'Table Tennis' },
  { id: 'badminton', emoji: '🏸', label: 'Badminton' },
  { id: 'tennis', emoji: '🎾', label: 'Tennis' },
];

const SPORT_IDS: Record<string, number> = {
  football: 1,
  basketball: 2,
  cricket: 3,
  tabletennis: 4,
  badminton: 5,
  tennis: 6,
};

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Experienced', 'Advanced'];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function PostScreen({ visible, onClose }: Props) {
  const colors = useColors();

  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [venue, setVenue] = useState('');
  const [fromTime, setFromTime] = useState<Date | null>(null);
  const [toTime, setToTime] = useState<Date | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [skill, setSkill] = useState<string | null>(null);
  const [players, setPlayers] = useState('2');

  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getFormattedDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getFormattedTime = (d: Date) => {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  const handlePost = async () => {
    if (!selectedSport) {
      Alert.alert("Missing Information", "Please select a sport.");
      return;
    }

    const trimmedVenue = venue.trim();
    if (!trimmedVenue) {
      Alert.alert("Missing Information", "Please enter a venue.");
      return;
    }
    
    if (PostManager.containsBadWord(trimmedVenue)) {
      Alert.alert("Inappropriate Content", "Venue name contains inappropriate language. Please use appropriate words.");
      return;
    }

    if (!date) {
      Alert.alert("Missing Information", "Please select a date");
      return;
    }

    if (!fromTime || !toTime) {
      Alert.alert("Missing Information", "Please select a start and end time");
      return;
    }

    if (fromTime >= toTime) {
      Alert.alert("Invalid Time", "End time must be after start time");
      return;
    }

    if (!skill) {
      Alert.alert("Missing Information", "Please select a skill level");
      return;
    }

    const playersNum = parseInt(players);
    if (isNaN(playersNum) || playersNum < 2) {
      Alert.alert("Missing Information", "Minimum 2 players are required for a match");
      return;
    }

    if (playersNum > 50) {
      Alert.alert("Missing Information", "Maximum 50 players are allowed per match");
      return;
    }
    
    const sportId = SPORT_IDS[selectedSport] || 1;

    try {
      setIsSubmitting(true);
      await PostManager.saveMatch({
        matchType: 'sport_community',
        venue: trimmedVenue,
        matchDate: getFormattedDate(date),
        matchTime: getFormattedTime(fromTime),
        sportId: sportId,
        skillLevel: skill,
        playersNeeded: playersNum,
      });
      
      Alert.alert("Success", "Match posted successfully!", [
        { text: "OK", onPress: () => onClose() }
      ]);
    } catch (error: any) {
      Alert.alert("Error", `Failed to post match: ${error.message || error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const selectedSportData = SPORTS.find((s) => s.id === selectedSport);

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
      backgroundColor: colors.backgroundSecondary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 24,
      paddingBottom: 48,
      paddingTop: 12,
      height: '95%',
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.backgroundQuaternary,
      alignSelf: 'center',
      marginBottom: 16,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    input: {
      height: 52,
      backgroundColor: colors.backgroundPrimary,
      borderRadius: 50,
      paddingHorizontal: 20,
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
      marginBottom: 12,
    },
    dropdown: {
      height: 52,
      backgroundColor: colors.backgroundPrimary,
      borderRadius: 50,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    dropdownText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 12,
    },
    rowLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      width: 90,
    },
    rowLabelText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.medium,
      color: colors.textPrimary,
    },
    rowButton: {
      flex: 1,
      height: 46,
      backgroundColor: colors.backgroundPrimary,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rowButtonText: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
    },
    playersInput: {
      flex: 1,
      height: 46,
      backgroundColor: colors.backgroundPrimary,
      borderRadius: 50,
      paddingHorizontal: 20,
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
    },
    postButton: {
      height: 52,
      borderRadius: 50,
      backgroundColor: colors.systemGreen,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
    },
    postButtonText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.semiBold,
      color: colors.primaryWhite,
    },

    // Dropdown list
    dropdownList: {
      backgroundColor: colors.backgroundPrimary,
      borderRadius: 16,
      marginTop: -4,
      marginBottom: 12,
      overflow: 'hidden',
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      gap: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.backgroundTertiary,
    },
    dropdownItemText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.sheet}>
              <View style={styles.handle} />

              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={18} color={colors.textPrimary} />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false}>

                {/* Select Sport */}
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => {
                    setShowSportDropdown(!showSportDropdown);
                    setShowSkillDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownText, {
                    color: selectedSport ? colors.textPrimary : colors.textTertiary
                  }]}>
                    {selectedSportData
                      ? `${selectedSportData.emoji}  ${selectedSportData.label}`
                      : 'Select sport'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
                </TouchableOpacity>

                {showSportDropdown && (
                  <View style={styles.dropdownList}>
                    {SPORTS.map((sport) => (
                      <TouchableOpacity
                        key={sport.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedSport(sport.id);
                          setShowSportDropdown(false);
                        }}
                      >
                        <Text style={{ fontSize: 20 }}>{sport.emoji}</Text>
                        <Text style={styles.dropdownItemText}>{sport.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Venue */}
                <TextInput
                  style={styles.input}
                  placeholder="📍  Venue"
                  placeholderTextColor={colors.textTertiary}
                  value={venue}
                  onChangeText={setVenue}
                />

                {/* Time */}
                <View style={styles.row}>
                  <View style={styles.rowLabel}>
                    <Ionicons name="time-outline" size={20} color={colors.systemGreen} />
                    <Text style={styles.rowLabelText}>Time</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.rowButton}
                    onPress={() => setShowFromPicker(true)}
                  >
                    <Text style={styles.rowButtonText}>
                      {fromTime ? formatTime(fromTime) : 'From'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rowButton}
                    onPress={() => setShowToPicker(true)}
                  >
                    <Text style={styles.rowButtonText}>
                      {toTime ? formatTime(toTime) : 'To'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Date */}
                <View style={styles.row}>
                  <View style={styles.rowLabel}>
                    <Ionicons name="calendar-outline" size={20} color={colors.systemGreen} />
                    <Text style={styles.rowLabelText}>Date</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.rowButton, { flex: 2 }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.rowButtonText}>
                      {date ? formatDate(date) : 'Select Date'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Skill */}
                <View style={styles.row}>
                  <View style={styles.rowLabel}>
                    <Ionicons name="radio-button-on-outline" size={20} color={colors.systemGreen} />
                    <Text style={styles.rowLabelText}>Skill</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.rowButton, { flex: 2 }]}
                    onPress={() => {
                      setShowSkillDropdown(!showSkillDropdown);
                      setShowSportDropdown(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.rowButtonText}>
                        {skill ?? 'Select skill level'}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color={colors.textTertiary} />
                    </View>
                  </TouchableOpacity>
                </View>

                {showSkillDropdown && (
                  <View style={styles.dropdownList}>
                    {SKILL_LEVELS.map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSkill(level);
                          setShowSkillDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{level}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Players */}
                <View style={styles.row}>
                  <View style={styles.rowLabel}>
                    <Ionicons name="people-outline" size={20} color={colors.systemGreen} />
                    <Text style={styles.rowLabelText}>Players</Text>
                  </View>
                  <TextInput
                    style={styles.playersInput}
                    value={players}
                    onChangeText={setPlayers}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>

                {/* Post Button */}
                <TouchableOpacity 
                  style={[styles.postButton, isSubmitting && { opacity: 0.7 }]} 
                  onPress={handlePost}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                     <ActivityIndicator color="white" />
                  ) : (
                     <Text style={styles.postButtonText}>Post</Text>
                  )}
                </TouchableOpacity>

              </ScrollView>

              {/* Date Picker */}
              {showDatePicker && (
                <DateTimePicker
                  value={date ?? new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(_, selected) => {
                    setShowDatePicker(false);
                    if (selected) setDate(selected);
                  }}
                />
              )}

              {/* From Time Picker */}
              {showFromPicker && (
                <DateTimePicker
                  value={fromTime ?? new Date()}
                  mode="time"
                  display="default"
                  onChange={(_, selected) => {
                    setShowFromPicker(false);
                    if (selected) {
                      setFromTime(selected);
                      // Auto calculate TO time (+1 hour) magically!
                      const upcomingEndTime = new Date(selected.getTime() + 60 * 60 * 1000);
                      setToTime(upcomingEndTime);
                    }
                  }}
                />
              )}

              {/* To Time Picker */}
              {showToPicker && (
                <DateTimePicker
                  value={toTime ?? new Date()}
                  mode="time"
                  display="default"
                  onChange={(_, selected) => {
                    setShowToPicker(false);
                    if (selected) setToTime(selected);
                  }}
                />
              )}

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}