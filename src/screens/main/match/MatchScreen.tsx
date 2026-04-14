import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import MatchCellCard from '../../../components/MatchCellCard';
import JoinedMatchesManager from '../../../services/JoinedMatchesManager';
import { DBMatch } from '../../../services/HomeManager';

export default function MatchScreen({ navigation }: any) {
  const colors = useColors();
  
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [upcomingMatches, setUpcomingMatches] = useState<DBMatch[]>([]);
  const [pastMatches, setPastMatches] = useState<DBMatch[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchUserMatches();
  }, []);

  const fetchUserMatches = async () => {
    try {
      const matches = await JoinedMatchesManager.fetchUserMatches();
      processMatches(matches);
      setErrorMsg(null);
    } catch (error: any) {
      setErrorMsg('Failed to load matches. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserMatches();
  }, []);

  const combineDateAndTime = (date: Date, time: Date): Date => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    
    const hh = String(time.getUTCHours()).padStart(2, '0');
    const min = String(time.getUTCMinutes()).padStart(2, '0');
    const ss = String(time.getUTCSeconds()).padStart(2, '0');

    // Interpret the date string explicitly in local timezone parsing logic similar to swift behavior
    // Swift uses `time.dateComponents([.hour, .minute])` applied to the Date directly.
    return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`);
  };

  const processMatches = (matches: DBMatch[]) => {
    const now = new Date();
    
    const upcoming: DBMatch[] = [];
    const past: DBMatch[] = [];

    for (const match of matches) {
      // In TS, date object creation from UTC string could shift. To strictly compare:
      const matchDateTime = combineDateAndTime(match.matchDate, match.matchTime);
      
      const isSameDay = match.matchDate.toDateString() === now.toDateString();
      
      if (isSameDay) {
        if (matchDateTime > now) {
          upcoming.push(match);
        } else {
          past.push(match);
        }
      } else if (matchDateTime > now) {
        upcoming.push(match);
      } else {
        past.push(match);
      }
    }

    // Sort upcoming ascending
    upcoming.sort((a, b) => combineDateAndTime(a.matchDate, a.matchTime).getTime() - combineDateAndTime(b.matchDate, b.matchTime).getTime());
    
    // Sort past descending
    past.sort((a, b) => combineDateAndTime(b.matchDate, b.matchTime).getTime() - combineDateAndTime(a.matchDate, a.matchTime).getTime());

    setUpcomingMatches(upcoming);
    setPastMatches(past);
  };

  const navigateToMatchInfo = (match: DBMatch) => {
    navigation.navigate('MatchInfo', { match });
  };

  const currentMatches = activeTab === 'upcoming' ? upcomingMatches : pastMatches;

  const formatDate = (dateString: Date): string => {
    const date = new Date(dateString);
    if (new Date().toDateString() === date.toDateString()) return 'Today';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.toDateString() === date.toDateString()) return 'Tomorrow';

    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear().toString().slice(-2);
    return `${d}/${m}/${y}`;
  };

  const formatTime = (timeString: Date): string => {
    const d = new Date(timeString);
    const h = d.getUTCHours();
    const m = d.getUTCMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatEndTime = (timeString: Date): string => {
    const startObj = new Date(timeString);
    const endObj = new Date(startObj.getTime() + 60 * 60 * 1000);
    return formatTime(endObj);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    headerTitle: {
      fontSize: 32,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      marginBottom: 16,
    },

    // Segmented Control
    segmentContainer: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 50,
      padding: 4,
    },
    segmentButton: {
      flex: 1,
      height: 40,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    segmentText: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.medium,
    },

    // List
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      paddingTop: 8,
      flexGrow: 1,
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      fontFamily: FontFamily.medium,
      color: colors.textTertiary,
      textAlign: 'center',
    },
    errorText: {
      fontSize: 16,
      fontFamily: FontFamily.medium,
      color: colors.systemRed,
      textAlign: 'center',
    }
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Matches</Text>

          {/* Segmented Control */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                {
                  backgroundColor:
                    activeTab === 'upcoming'
                      ? colors.backgroundPrimary
                      : 'transparent',
                },
              ]}
              onPress={() => setActiveTab('upcoming')}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color:
                      activeTab === 'upcoming'
                        ? colors.textPrimary
                        : colors.textTertiary,
                    fontFamily:
                      activeTab === 'upcoming'
                        ? FontFamily.semiBold
                        : FontFamily.regular,
                  },
                ]}
              >
                Upcoming
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                {
                  backgroundColor:
                    activeTab === 'past'
                      ? colors.textPrimary
                      : 'transparent',
                },
              ]}
              onPress={() => setActiveTab('past')}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color:
                      activeTab === 'past'
                        ? colors.backgroundPrimary
                        : colors.textTertiary,
                    fontFamily:
                      activeTab === 'past'
                        ? FontFamily.semiBold
                        : FontFamily.regular,
                  },
                ]}
              >
                Past
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.textPrimary} />
          </View>
        ) : errorMsg ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : (
          <FlatList
            data={currentMatches}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                tintColor={colors.textTertiary}
              />
            }
            ListEmptyComponent={() => (
              <View style={[styles.centerContent, { marginTop: 150 }]}>
                <Text style={styles.emptyText}>
                  {activeTab === 'upcoming' ? 'No upcoming matches' : 'No past matches'}
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
              <MatchCellCard
                venue={item.venue}
                date={formatDate(item.matchDate)}
                startTime={formatTime(item.matchTime)}
                endTime={formatEndTime(item.matchTime)}
                slotsLeft={item.playersNeeded - item.playersRSVPed}
                totalSlots={item.playersNeeded}
                goingCount={item.playersRSVPed}
                onPress={() => navigateToMatchInfo(item)}
              />
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}