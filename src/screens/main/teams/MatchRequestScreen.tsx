import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import { supabase } from '../../../lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MatchRequest {
  id: number;
  challenging_team_id: string;
  challenged_team_id: string;
  proposed_venue: string;
  proposed_date: string;  // yyyy-MM-dd
  proposed_time: string;  // HH:mm:ss
  status: string;
  created_at: string;
  // enriched after fetch
  challengingTeamName?: string;
  challengingTeamSportId?: number | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  team?: any;
  teamId?: string;
}

// ---------------------------------------------------------------------------
// Formatting helpers  (mirror Swift logic)
// ---------------------------------------------------------------------------

function displayDate(d: string): string {
  // yyyy-MM-dd → dd/MM/yy
  const parts = d.split('-');
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
}

function relativeDate(d: string): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const fmt = (dt: Date) => dt.toISOString().split('T')[0];
  if (d === fmt(today)) return 'Today';
  if (d === fmt(tomorrow)) return 'Tomorrow';
  return displayDate(d);
}

function displayTime(t: string): string {
  // HH:mm:ss → h:mm AM/PM
  const [hStr, mStr] = t.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function timeRange(t: string): string {
  const start = displayTime(t);
  const [hStr] = t.split(':');
  let h = parseInt(hStr, 10) + 1;
  const endAmpm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const end = `${h}:${t.split(':')[1]} ${endAmpm}`;
  return `${start} - ${end}`;
}

function isPM(t: string): boolean {
  return parseInt(t.split(':')[0], 10) >= 12;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function MatchRequestScreen({ visible, onClose, team, teamId }: Props) {
  const colors = useColors();
  const isDark = colors.isDark;

  const activeTeamId: string | undefined = team?.id ?? teamId;

  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actioning, setActioning] = useState<number | null>(null); // id being actioned

  // -------- fetch --------
  const fetchRequests = useCallback(async () => {
    if (!activeTeamId) return;
    setLoading(true);
    try {
      // 1. Fetch pending match_requests where we are the challenged team
      const { data: rows, error } = await supabase
        .from('match_requests')
        .select('*')
        .eq('challenged_team_id', activeTeamId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!rows || rows.length === 0) {
        setRequests([]);
        return;
      }

      // 2. Enrich with challenging team names + sport_id
      const teamIds = [...new Set(rows.map((r: any) => r.challenging_team_id))];
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name, sport_id')
        .in('id', teamIds);

      const teamMap: Record<string, { name: string; sport_id: number | null }> = {};
      (teamsData ?? []).forEach((t: any) => {
        teamMap[t.id] = { name: t.name, sport_id: t.sport_id ?? null };
      });

      const enriched: MatchRequest[] = rows.map((r: any) => ({
        ...r,
        challengingTeamName: teamMap[r.challenging_team_id]?.name ?? 'Unknown Team',
        challengingTeamSportId: teamMap[r.challenging_team_id]?.sport_id ?? null,
      }));

      setRequests(enriched);
    } catch (err) {
      console.error('❌ MatchRequestScreen fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTeamId]);

  useEffect(() => {
    if (visible) fetchRequests();
  }, [visible, fetchRequests]);

  // -------- accept --------
  const handleAccept = async (req: MatchRequest) => {
    Alert.alert(
      'Accept Request',
      `Accept match request from ${req.challengingTeamName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setActioning(req.id);
            try {
              const { data: { session } } = await supabase.auth.getSession();
              const userId = session?.user?.id;
              if (!userId) throw new Error('Not authenticated');

              // 1. Create a team_challenge match row
              const { data: matchRow, error: matchErr } = await supabase
                .from('matches')
                .insert({
                  match_type: 'team_challenge',
                  venue: req.proposed_venue,
                  match_date: req.proposed_date,
                  match_time: req.proposed_time,
                  sport_id: req.challengingTeamSportId,
                  team_id: req.challenging_team_id,
                  opponent_team_id: req.challenged_team_id,
                  players_needed: 0,
                  posted_by_user_id: userId,
                })
                .select('id')
                .single();

              if (matchErr) throw matchErr;

              // 2. Update match_request status → accepted and link match_id
              const { error: updateErr } = await supabase
                .from('match_requests')
                .update({
                  status: 'accepted',
                  match_id: matchRow.id,
                  responded_at: new Date().toISOString(),
                })
                .eq('id', req.id);

              if (updateErr) throw updateErr;

              // 3. Remove from local state
              setRequests(prev => prev.filter(r => r.id !== req.id));
              setExpandedId(null);
              Alert.alert('Success', 'Match request accepted! The match has been scheduled.');
            } catch (err: any) {
              console.error('❌ accept:', err);
              Alert.alert('Error', err?.message ?? 'Failed to accept match request.');
            } finally {
              setActioning(null);
            }
          },
        },
      ]
    );
  };

  // -------- decline --------
  const handleDecline = async (req: MatchRequest) => {
    Alert.alert(
      'Decline Request',
      `Decline match request from ${req.challengingTeamName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setActioning(req.id);
            try {
              const { error } = await supabase
                .from('match_requests')
                .delete()
                .eq('id', req.id);

              if (error) throw error;

              setRequests(prev => prev.filter(r => r.id !== req.id));
              setExpandedId(null);
            } catch (err: any) {
              console.error('❌ decline:', err);
              Alert.alert('Error', err?.message ?? 'Failed to decline match request.');
            } finally {
              setActioning(null);
            }
          },
        },
      ]
    );
  };

  // -------- colours --------
  const cardBg = isDark ? '#282828' : '#E5E5EA';
  const pillBg = isDark ? '#3A3A3C' : '#D1D1D6';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subColor = isDark ? '#8E8E93' : '#8E8E93';

  // -------- render --------
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>

              {/* Handle */}
              <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : '#C7C7CC' }]} />

              {/* Title */}
              <Text style={[styles.title, { color: textColor }]}>Match Requests</Text>

              {/* Content */}
              {loading ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={colors.systemGreen} />
                </View>
              ) : requests.length === 0 ? (
                <View style={styles.centered}>
                  <Ionicons name="document-outline" size={40} color={subColor} />
                  <Text style={[styles.emptyText, { color: subColor }]}>No pending match requests</Text>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
                  {requests.map(req => {
                    const isExpanded = expandedId === req.id;
                    const isActioning = actioning === req.id;
                    const pm = isPM(req.proposed_time);
                    const timeIcon = pm ? 'moon' : 'sunny-outline';
                    const timeIconColor = pm ? '#007AFF' : '#FFD60A';

                    if (isExpanded) {
                      return (
                        <TouchableOpacity
                          key={req.id}
                          style={[styles.expandedCard, { backgroundColor: cardBg }]}
                          onPress={() => setExpandedId(null)}
                          activeOpacity={0.95}
                        >
                          {/* Team name */}
                          <Text style={[styles.expandedTeamName, { color: textColor }]}>
                            {req.challengingTeamName}
                          </Text>

                          {/* Venue */}
                          <View style={styles.infoRow}>
                            <Text style={{ fontSize: 18 }}>📍</Text>
                            <Text style={[styles.infoText, { color: textColor }]}>{req.proposed_venue}</Text>
                          </View>

                          {/* Date + Time */}
                          <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={20} color={subColor} />
                            <Text style={[styles.infoText, { color: textColor }]}>
                              {relativeDate(req.proposed_date)}
                            </Text>
                            <Ionicons
                              name={timeIcon as any}
                              size={20}
                              color={timeIconColor}
                              style={{ marginLeft: 16 }}
                            />
                            <Text style={[styles.infoText, { color: textColor }]}>
                              {timeRange(req.proposed_time)}
                            </Text>
                          </View>

                          {/* Buttons */}
                          <View style={styles.expandedButtons}>
                            <TouchableOpacity
                              style={[styles.declineBtn, { backgroundColor: pillBg }]}
                              onPress={() => handleDecline(req)}
                              disabled={isActioning}
                            >
                              {isActioning ? (
                                <ActivityIndicator color="#FF3B30" />
                              ) : (
                                <Text style={styles.declineText}>Decline</Text>
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.acceptBtn, { backgroundColor: pillBg }]}
                              onPress={() => handleAccept(req)}
                              disabled={isActioning}
                            >
                              {isActioning ? (
                                <ActivityIndicator color={colors.systemGreen} />
                              ) : (
                                <Text style={[styles.acceptText, { color: colors.systemGreen }]}>Accept</Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      );
                    }

                    // Collapsed row
                    return (
                      <TouchableOpacity
                        key={req.id}
                        style={[styles.collapsedCard, { backgroundColor: cardBg }]}
                        onPress={() => setExpandedId(req.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.collapsedTeamName, { color: textColor }]}>
                          {req.challengingTeamName}
                        </Text>
                        <View style={styles.collapsedButtons}>
                          <TouchableOpacity
                            style={[styles.pillBtn, { backgroundColor: pillBg }]}
                            onPress={() => handleDecline(req)}
                            disabled={isActioning}
                          >
                            {isActioning ? (
                              <ActivityIndicator size="small" color="#FF3B30" />
                            ) : (
                              <Text style={styles.declineText}>Decline</Text>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.pillBtn, { backgroundColor: pillBg }]}
                            onPress={() => handleAccept(req)}
                            disabled={isActioning}
                          >
                            {isActioning ? (
                              <ActivityIndicator size="small" color={colors.systemGreen} />
                            ) : (
                              <Text style={[styles.acceptText, { color: colors.systemGreen }]}>Accept</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 48,
    paddingTop: 12,
    maxHeight: '72%',
  },

  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },

  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    marginBottom: 16,
  },

  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },

  emptyText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
  },

  // ── Collapsed card ──
  collapsedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  collapsedTeamName: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
  },
  collapsedButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    minWidth: 72,
    alignItems: 'center',
  },

  // ── Expanded card ──
  expandedCard: {
    borderRadius: 24,
    padding: 20,
  },
  expandedTeamName: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  infoText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
  },
  expandedButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  declineBtn: {
    flex: 1,
    height: 46,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    flex: 1,
    height: 46,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Text colours ──
  declineText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: '#FF3B30',
  },
  acceptText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
  },
});