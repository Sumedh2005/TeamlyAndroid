import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import { supabase } from '../../../lib/supabase';

// Local Types
interface UserProfile {
  id: string;
  name: string;
  gender: string | null;
  age: number | null;
  college_id: number | null;
  profile_pic: string | null;
}

export default function SearchScreen({ navigation }: any) {
  const colors = useColors();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const isDarkMode = colors.backgroundPrimary === '#000000' || colors.backgroundPrimary === '#121212';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      // 1. Get Session Info
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return; // handle error ideally
      }
      const myId = session.user.id;
      setCurrentUserId(myId);

      // 2. Fetch Mutual Blocks
      const { data: blockRelationships, error: blockErr } = await supabase
        .from('blocked')
        .select('blocked_by_user, blocked_user')
        .or(`blocked_by_user.eq.${myId},blocked_user.eq.${myId}`);

      const blockedIds = new Set<string>();
      if (!blockErr && blockRelationships) {
        blockRelationships.forEach((row) => {
          if (row.blocked_by_user !== myId) blockedIds.add(row.blocked_by_user);
          if (row.blocked_user !== myId) blockedIds.add(row.blocked_user);
        });
      }

      // 3. Fetch All Users (similar to Swift)
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select()
        .order('name', { ascending: true });

      if (!profErr && profiles) {
        const processedUsers: UserProfile[] = profiles
          .filter((p: any) => !blockedIds.has(p.id) && p.id !== myId)
          .map((p: any) => ({
            id: p.id,
            name: p.name || 'Unknown',
            gender: p.gender,
            age: p.age,
            college_id: p.college_id,
            profile_pic: p.profile_pic,
          }));

        setAllUsers(processedUsers);
      }
    } catch (error) {
      console.error('Error fetching search data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    const query = text.toLowerCase().trim();

    if (!query) {
      setFilteredUsers([]);
      return;
    }

    const filtered = allUsers.filter(user => user.name.toLowerCase().includes(query));
    setFilteredUsers(filtered);
  };

  const renderCell = ({ item }: { item: UserProfile }) => {
    let details = '';
    if (item.age) details += `${item.age} years`;
    if (item.gender) {
      if (details) details += ' • ';
      details += item.gender;
    }
    if (!details) details = 'No details';

    return (
      <TouchableOpacity 
        style={styles.cellContainer}
        activeOpacity={0.7}
        onPress={() => {
          Keyboard.dismiss();
          navigation.navigate('UserProfileScreen', { userId: item.id });
        }}
      >
        <Ionicons 
          name="person-circle" 
          size={45} 
          color={isDarkMode ? '#555555' : '#D1D1D6'} 
          style={styles.cellIcon}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.cellName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {item.name}
          </Text>
          <Text style={[styles.cellDetails, { color: isDarkMode ? '#8E8E93' : '#666666' }]}>
            {details}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    linearGradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 150,
    },
    safeArea: {
      flex: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 8,
      gap: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 50,
      paddingHorizontal: 16,
      height: 48,
      gap: 10,
    },
    searchIcon: {},
    searchInput: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
    },
    clearButton: {
      padding: 4,
    },
    listContent: {
      paddingBottom: 40,
    },
    cellContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderBottomWidth: 0.5,
      borderBottomColor: isDarkMode ? '#333333' : '#E5E5EA',
    },
    cellIcon: {
      marginRight: 14,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    cellName: {
      fontSize: 16,
      fontFamily: FontFamily.medium,
      marginBottom: 2,
    },
    cellDetails: {
      fontSize: 14,
      fontFamily: FontFamily.regular,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    }
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(52, 199, 89, 0.18)', 'rgba(52, 199, 89, 0)']}
        style={styles.linearGradient}
      />
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header row: back button + search bar inline */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={18} color={colors.systemGreen} />
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search players"
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoFocus={true}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => handleSearchChange('')}
              >
                <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#8E8E93" />
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={item => item.id}
            renderItem={renderCell}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            onScroll={() => Keyboard.dismiss()}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
