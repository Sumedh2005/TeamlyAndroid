import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize, LineHeight } from '../../../theme/fonts';
import CreateTeamSheet, { CreatedTeam } from './CreateTeamSheet';

interface SportData {
  id: number;
  name: string;
  emoji: string;
}

interface TeamWithSport {
  id: string;
  name: string;
  sport_id: number;
  college_id: number | null;
  captain_id: string;
  created_at: string;
  sports?: SportData | SportData[];
}

export default function TeamScreen({ navigation }: any) {
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  
  const [teams, setTeams] = useState<TeamWithSport[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadUserTeams();
    }, [])
  );

  const loadUserTeams = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setTeams([]);
        setLoading(false);
        return;
      }
      
      const userId = session.user.id;
      setCurrentUserId(userId);
      
      const { data: memberships } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId);
      
      if (!memberships || memberships.length === 0) {
        setTeams([]);
        setLoading(false);
        return;
      }
      
      const teamIds = memberships.map(m => m.team_id);
      
      const { data: teamsData, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          sport_id,
          college_id,
          captain_id,
          created_at,
          sports:sport_id (
            id,
            name,
            emoji
          )
        `)
        .in('id', teamIds);
        
      if (error) {
        console.error('Error fetching teams data:', error);
      } else if (teamsData) {
        setTeams(teamsData as any);
      }
    } catch (err) {
      console.error('Exception fetching teams', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleTeamPress = (team: TeamWithSport) => {
    const sportName = Array.isArray(team.sports) ? team.sports[0]?.name : (team.sports?.name || 'Unknown');
    const sportEmoji = Array.isArray(team.sports) ? team.sports[0]?.emoji : (team.sports?.emoji || '🏅');

    navigation.navigate('TeamChat', {
      teamId: team.id,
      team: {
        id: team.id,
        name: team.name,
        sport: sportName,
        emoji: sportEmoji,
        isCaptain: team.captain_id === currentUserId,
        members: [], 
      },
    });
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.backgroundPrimary },
    container: { flex: 1, paddingHorizontal: 20 },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 16,
      paddingBottom: 16,
    },
    title: {
      fontSize: 32,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Search
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 50,
      paddingHorizontal: 16,
      height: 48,
      marginBottom: 20,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      padding: 0,
      color: colors.textPrimary,
    },

    // List
    listContent: { gap: 12, paddingBottom: 40 },
    teamItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 18,
      paddingHorizontal: 18,
      paddingVertical: 18,
      backgroundColor: colors.backgroundSecondary,
    },
    teamEmoji: { fontSize: 26, marginRight: 14 },
    teamName: {
      flex: 1,
      fontSize: FontSize.lg,
      fontFamily: FontFamily.medium,
      lineHeight: LineHeight.lg,
      color: colors.textPrimary,
    },
    centerState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: -100,
    },
    emptyText: {
      fontSize: 18,
      fontFamily: FontFamily.medium,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: 20,
    }
  });

  return (
    <SafeAreaView style={styles.safe}>
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
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Teams</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreate(true)}
          >
            <Ionicons name="add" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search teams"
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.textPrimary} />
          </View>
        ) : teams.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons name="shield-half-outline" size={80} color={colors.textTertiary} />
            <Text style={styles.emptyText}>Not in a team yet{'\n'}Create your own</Text>
          </View>
        ) : search.length > 0 && filtered.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyText}>This team doesn't exist</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const sportEmoji = Array.isArray(item.sports) ? item.sports[0]?.emoji : (item.sports?.emoji || '🏅');
              return (
                <TouchableOpacity
                  style={styles.teamItem}
                  activeOpacity={0.7}
                  onPress={() => handleTeamPress(item)}
                >
                  <Text style={styles.teamEmoji}>{sportEmoji}</Text>
                  <Text style={styles.teamName}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              )
            }}
          />
        )}

      </View>

      <CreateTeamSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(_team: CreatedTeam) => {
          setShowCreate(false);
          loadUserTeams();
        }}
      />
    </SafeAreaView>
  );
}