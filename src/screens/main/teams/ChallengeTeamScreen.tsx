import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Switch,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import { supabase } from '../../../lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChallengeTeam {
  id: string;
  name: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  team?: any;   // full team object from route: { id, name, sport_id, captain_id, ... }
  teamId?: string; // fallback if team object not available
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]; // yyyy-MM-dd
}

function toTimeStr(d: Date) {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}:00`;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ChallengeTeamScreen({ visible, onClose, team, teamId }: Props) {
  const colors = useColors();
  const isDark = colors.isDark;
  const insets = useSafeAreaInsets();

  // -------- form state --------
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [fromTime, setFromTime] = useState<Date | null>(null);
  const [toTime, setToTime] = useState<Date | null>(null);
  const [isChallengeMode, setIsChallengeMode] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedTeamName, setSelectedTeamName] = useState<string | null>(null);
  const [isTeamListOpen, setIsTeamListOpen] = useState(false);

  // Pickers (Android shows inline; iOS uses bottom sheet logic)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // -------- data state --------
  const [challengeTeams, setChallengeTeams] = useState<ChallengeTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const activeTeamId = team?.id ?? teamId;

  // -------- fetch same-sport teams --------
  const loadChallengeTeams = useCallback(async () => {
    if (!activeTeamId) return;
    setTeamsLoading(true);
    try {
      // Get current team's sport_id
      let sportId = team?.sport_id;
      if (!sportId) {
        const { data } = await supabase
          .from('teams')
          .select('sport_id')
          .eq('id', activeTeamId)
          .single();
        sportId = data?.sport_id;
      }

      if (!sportId) {
        setChallengeTeams([]);
        return;
      }

      // Fetch all teams with same sport, excluding current team
      const { data } = await supabase
        .from('teams')
        .select('id, name')
        .eq('sport_id', sportId)
        .neq('id', activeTeamId)
        .order('name');

      setChallengeTeams(data ?? []);
    } catch (err) {
      console.error('❌ loadChallengeTeams:', err);
    } finally {
      setTeamsLoading(false);
    }
  }, [activeTeamId, team?.sport_id]);

  // -------- get current user on open --------
  useEffect(() => {
    if (!visible) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id ?? null);
    })();
  }, [visible]);

  // -------- load teams when challenge mode turns on --------
  useEffect(() => {
    if (isChallengeMode && visible) {
      loadChallengeTeams();
    }
  }, [isChallengeMode, visible, loadChallengeTeams]);

  // -------- reset on close --------
  const handleClose = () => {
    setVenue('');
    setDate(null);
    setFromTime(null);
    setToTime(null);
    setIsChallengeMode(false);
    setSelectedTeamId(null);
    setSelectedTeamName(null);
    setIsTeamListOpen(false);
    setChallengeTeams([]);
    onClose();
  };

  // -------- submit --------
  const handleChallenge = async () => {
    if (!venue.trim()) {
      Alert.alert('Missing Field', 'Please enter a venue');
      return;
    }
    if (!fromTime) {
      Alert.alert('Missing Field', 'Please select a start time');
      return;
    }
    if (!date) {
      Alert.alert('Missing Field', 'Please select a date');
      return;
    }
    if (isChallengeMode && !selectedTeamId) {
      Alert.alert('Missing Field', 'Please select a team to challenge');
      return;
    }
    if (!activeTeamId || !currentUserId) {
      Alert.alert('Error', 'Team or user data not available');
      return;
    }

    setSubmitting(true);
    Keyboard.dismiss();

    try {
      const formattedDate = toDateStr(date);
      const formattedTime = toTimeStr(fromTime);

      if (isChallengeMode) {
        // Create a match_request
        const { error } = await supabase.from('match_requests').insert({
          challenging_team_id: activeTeamId,
          challenged_team_id: selectedTeamId,
          proposed_venue: venue.trim(),
          proposed_date: formattedDate,
          proposed_time: formattedTime,
          status: 'pending',
        });
        if (error) throw error;

        const challengedName =
          challengeTeams.find(t => t.id === selectedTeamId)?.name ?? 'team';
        Alert.alert('Challenge Sent!', `Match request sent to ${challengedName}`, [
          { text: 'OK', onPress: handleClose },
        ]);
      } else {
        // Get sport_id
        let sportId = team?.sport_id;
        if (!sportId) {
          const { data } = await supabase
            .from('teams')
            .select('sport_id')
            .eq('id', activeTeamId)
            .single();
          sportId = data?.sport_id;
        }

        const { error } = await supabase.from('matches').insert({
          match_type: 'team_internal',
          venue: venue.trim(),
          match_date: formattedDate,
          match_time: formattedTime,
          sport_id: sportId,
          team_id: activeTeamId,
          players_needed: 0,
          posted_by_user_id: currentUserId,
        });
        if (error) throw error;

        Alert.alert('Match Created!', 'Internal match has been scheduled', [
          { text: 'OK', onPress: handleClose },
        ]);
      }
    } catch (err: any) {
      console.error('❌ handleChallenge:', err);
      Alert.alert('Error', err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // -------- styles --------
  const bg = isDark ? '#151515' : '#F2F2F7';
  const cardBg = isDark ? '#282828' : '#E5E5EA';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const placeholderColor = isDark ? '#8E8E93' : '#8E8E93';
  const teamBoxBg = isDark ? '#1E1E1E' : '#D1D1D6';
  const green = colors.systemGreen;

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>

      {/* Dimmed backdrop */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <View style={[styles.sheet, { backgroundColor: bg, paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            {/* Drag bar */}
            <View style={[styles.dragBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : '#C7C7CC' }]} />

            {/* Title */}
            <Text style={[styles.title, { color: textColor }]}>Challenge Team</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}
            >

              {/* ── Venue ── */}
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundTertiary, color: colors.textPrimary }]}
                placeholder="📍  Venue"
                placeholderTextColor={colors.textTertiary}
                value={venue}
                onChangeText={setVenue}
              />

              {/* ── Time ── */}
              <View style={styles.row}>
                <View style={styles.rowLabel}>
                  <Ionicons name="time-outline" size={20} color={colors.systemGreen} />
                  <Text style={[styles.rowLabelText, { color: colors.textPrimary }]}>Time</Text>
                </View>
                <TouchableOpacity
                  style={[styles.rowButton, { backgroundColor: colors.backgroundTertiary }]}
                  onPress={() => setShowFromPicker(true)}
                >
                  <Text style={[styles.rowButtonText, { color: colors.textPrimary }]}>
                    {fromTime ? formatTime(fromTime) : 'From'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rowButton, { backgroundColor: colors.backgroundTertiary }]}
                  onPress={() => setShowToPicker(true)}
                >
                  <Text style={[styles.rowButtonText, { color: colors.textPrimary }]}>
                    {toTime ? formatTime(toTime) : 'To'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── Date ── */}
              <View style={styles.row}>
                <View style={styles.rowLabel}>
                  <Ionicons name="calendar-outline" size={20} color={colors.systemGreen} />
                  <Text style={[styles.rowLabelText, { color: colors.textPrimary }]}>Date</Text>
                </View>
                <TouchableOpacity
                  style={[styles.rowButton, { flex: 2, backgroundColor: colors.backgroundTertiary }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.rowButtonText, { color: colors.textPrimary }]}>
                    {date ? formatDate(date) : 'Select Date'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── Challenge toggle ── */}
              <View style={[styles.row, { justifyContent: 'space-between' }]}>
                <View style={styles.rowLabel}>
                  <Ionicons name="people-circle-outline" size={24} color={green} />
                  <Text style={[styles.rowLabelText, { color: colors.textPrimary, marginLeft: -2 }]}>Challenge</Text>
                </View>
                <Switch
                  value={isChallengeMode}
                  onValueChange={(v) => {
                    setIsChallengeMode(v);
                    setSelectedTeamId(null);
                    setSelectedTeamName(null);
                    setIsTeamListOpen(false);
                  }}
                  trackColor={{ false: '#767577', true: green }}
                  thumbColor="#fff"
                />
              </View>

              {/* ── Team list (challenge mode) ── */}
              {isChallengeMode && (
                <>
                  {/* Collapsed pill — tap to open (only when no team chosen yet) */}
                  {!isTeamListOpen && (
                    <TouchableOpacity
                      style={[
                        styles.teamPill,
                        { backgroundColor: cardBg },
                      ]}
                      onPress={() => {
                        // Can't reopen once a team is selected
                        if (!selectedTeamId) setIsTeamListOpen(true);
                      }}
                      activeOpacity={selectedTeamId ? 1 : 0.7}
                    >
                      <Text style={[styles.teamPillText, { color: selectedTeamId ? textColor : placeholderColor }]}>
                        {selectedTeamName ?? 'Challenge team'}
                      </Text>
                      {!selectedTeamId && (
                        <Ionicons name="chevron-down" size={16} color={placeholderColor} />
                      )}
                    </TouchableOpacity>
                  )}

                  {/* Expanded list */}
                  {isTeamListOpen && (
                    <View style={[styles.teamBox, { backgroundColor: teamBoxBg }]}>
                      {teamsLoading ? (
                        <ActivityIndicator color={green} style={{ marginVertical: 16 }} />
                      ) : challengeTeams.length === 0 ? (
                        <Text style={[styles.emptyText, { color: placeholderColor }]}>
                          No teams available to challenge
                        </Text>
                      ) : (
                        challengeTeams.map(t => (
                          <View
                            key={t.id}
                            style={[styles.teamRow, { backgroundColor: cardBg }]}
                          >
                            <Text style={[styles.teamName, { color: textColor }]}>{t.name}</Text>
                            <TouchableOpacity
                              style={[styles.sendBtn, { backgroundColor: green }]}
                              onPress={() => {
                                setSelectedTeamId(t.id);
                                setSelectedTeamName(t.name);
                                setIsTeamListOpen(false); // close & lock
                              }}
                            >
                              <Text style={[styles.sendBtnText, { color: '#fff' }]}>Send</Text>
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </>
              )}

              {/* ── Challenge button ── */}
              <TouchableOpacity
                style={[styles.challengeBtn, { backgroundColor: green }]}
                onPress={handleChallenge}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.challengeBtnText}>Challenge</Text>
                )}
              </TouchableOpacity>

            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </View>

      {/* ── Pickers ── */}
      {showDatePicker && (
        <DateTimePicker
          value={date ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={(_, selected) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selected) setDate(selected);
            if (Platform.OS !== 'ios') setShowDatePicker(false);
          }}
        />
      )}
      {showFromPicker && (
        <DateTimePicker
          value={fromTime ?? new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minuteInterval={15}
          onChange={(_, selected) => {
            setShowFromPicker(Platform.OS === 'ios');
            if (selected) {
              setFromTime(selected);
              // Auto-set To = From + 1 hour
              const auto = new Date(selected.getTime() + 60 * 60 * 1000);
              setToTime(auto);
            }
            if (Platform.OS !== 'ios') setShowFromPicker(false);
          }}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={toTime ?? new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minuteInterval={15}
          onChange={(_, selected) => {
            setShowToPicker(Platform.OS === 'ios');
            if (selected) setToTime(selected);
            if (Platform.OS !== 'ios') setShowToPicker(false);
          }}
        />
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
  },

  dragBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 16,
  },

  // Venue row
  input: {
    height: 52,
    borderRadius: 50,
    paddingHorizontal: 20,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    marginBottom: 12,
    marginTop: 8,
  },
  
  // Generic label row
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
  },
  rowButton: {
    flex: 1,
    height: 46,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowButtonText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
  },

  // Team list box
  teamBox: {
    borderRadius: 20,
    padding: 10,
    gap: 8,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  sendBtn: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  sendBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },

  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    paddingVertical: 16,
  },

  // Collapsed team selector pill
  teamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  teamPillText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },

  // Challenge button
  challengeBtn: {
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  challengeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});