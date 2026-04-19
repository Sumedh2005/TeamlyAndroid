import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';

const MOCK_FRIENDS = [
  { id: '1', name: 'Aditi Onkar' },
  { id: '2', name: 'Dhruva' },
  { id: '3', name: 'Rushil' },
  { id: '4', name: 'Sonia' },
  { id: '5', name: 'Karan' },
  { id: '6', name: 'Meera' },
  { id: '7', name: 'Arjun' },
  { id: '8', name: 'Priya' },
];

export default function AddPlayersScreen({ navigation }: any) {
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>(['1', '3']);

  const filtered = MOCK_FRIENDS.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.backgroundPrimary },
    safeArea: { flex: 1 },

    // Header
    header: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 32,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      marginBottom: 16,
    },

    // Search
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 50,
      paddingHorizontal: 16,
      height: 48,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
    },

    // List
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 100,
      gap: 10,
    },

    // Friend row
    friendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 50,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 14,
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    friendName: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: FontFamily.medium,
      color: colors.textPrimary,
    },
    checkbox: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Add Button
    bottomContainer: {
      position: 'absolute',
      bottom: 40,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    addButton: {
      height: 52,
      paddingHorizontal: 64,
      borderRadius: 50,
      backgroundColor: colors.systemGreen,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButtonText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.semiBold,
      color: colors.primaryWhite,
    },
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={colors.systemGreen} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Players</Text>

          {/* Search */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends..."
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* Friends List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {filtered.map(friend => {
            const isSelected = selected.includes(friend.id);
            return (
              <TouchableOpacity
                key={friend.id}
                style={styles.friendRow}
                onPress={() => toggleSelect(friend.id)}
                activeOpacity={0.7}
              >
                <View style={styles.avatarCircle}>
                  <Ionicons name="person-outline" size={22} color={colors.textTertiary} />
                </View>
                <Text style={styles.friendName}>{friend.name}</Text>
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: isSelected
                        ? colors.systemGreen
                        : colors.backgroundTertiary,
                    },
                  ]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color={colors.primaryWhite} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Add Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}