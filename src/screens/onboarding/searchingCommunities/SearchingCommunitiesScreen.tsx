import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import { IndianCitiesData, IndianCity } from './IndianCity';

const { height } = Dimensions.get('window');

const CITY_COLLEGES: Record<string, string[]> = {
  Chennai: ['SRM University'],
};

export default function SearchingCommunitiesScreen({ navigation }: any) {
  const colors = useColors();
  const [showAlert, setShowAlert] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<IndianCity | null>(null);

  const filteredCities = IndianCitiesData.filter((city) =>
    city.name.toLowerCase().startsWith(searchQuery.toLowerCase())
  );

  const colleges = selectedCity ? CITY_COLLEGES[selectedCity.name] || [] : [];

  const handleSearch = () => {
    setShowAlert(false);
    setShowSearch(true);
  };

  const handleSelectCity = (city: IndianCity) => {
    setSelectedCity(city);
    setShowSearch(false);
    setShowCityModal(true);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    mapImage: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      opacity: 0.6,
    },

    // Alert Card
    alertOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    alertCard: {
      width: '100%',
      backgroundColor: colors.backgroundPrimary,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    alertTitle: {
      fontSize: 22,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 12,
    },
    alertSubtitle: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    alertDivider: {
      width: '100%',
      height: 0.5,
      backgroundColor: colors.backgroundQuaternary,
      marginBottom: 16,
    },
    alertButton: {
      paddingVertical: 4,
    },
    alertButtonText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.semiBold,
      color: '#007AFF',
    },

    // Search Modal
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContainer: {
      backgroundColor: colors.backgroundPrimary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      paddingHorizontal: 20,
      height: height * 0.75,
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.backgroundQuaternary,
      alignSelf: 'center',
      marginBottom: 20,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 50,
      paddingHorizontal: 16,
      height: 48,
      marginBottom: 16,
      gap: 10,
    },
    searchIcon: {
      fontSize: 16,
      color: colors.textTertiary,
    },
    searchInput: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
    },
    clearButton: {
      fontSize: 16,
      color: colors.textTertiary,
    },
    cityItem: {
      paddingVertical: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.backgroundTertiary,
    },
    cityName: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.medium,
      color: colors.textPrimary,
    },
    cityState: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.regular,
      color: colors.textSecondary,
      marginTop: 2,
    },

    // City Result Modal
    cityModalContainer: {
      backgroundColor: colors.backgroundSecondary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      paddingHorizontal: 20,
      paddingBottom: 48,
      height: height * 0.6,
    },
    cityModalTitle: {
      fontSize: 22,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 24,
    },
    collegeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.backgroundPrimary,
      borderRadius: 50,
      paddingVertical: 14,
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    collegeName: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.medium,
      color: colors.textPrimary,
    },
    joinButton: {
      height: 36,
      paddingHorizontal: 20,
      borderRadius: 50,
      backgroundColor: colors.systemGreen,
      justifyContent: 'center',
      alignItems: 'center',
    },
    joinButtonText: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.semiBold,
      color: colors.primaryWhite,
    },
    noCommunitiesText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 40,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Map Background */}
      <Image
        source={require('../../../assets/map.png')}
        style={styles.mapImage}
        resizeMode="cover"
      />

      {/* Alert Card */}
      {showAlert && (
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>Join College Community</Text>
            <Text style={styles.alertSubtitle}>
              To join your college community we need your college city
            </Text>
            <View style={styles.alertDivider} />
            <TouchableOpacity style={styles.alertButton} onPress={handleSearch}>
              <Text style={styles.alertButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSearch(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSearch(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHandle} />
                <View style={styles.searchBar}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search city..."
                    placeholderTextColor={colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Text style={styles.clearButton}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <FlatList
                  data={filteredCities}
                  keyExtractor={(item) => `${item.name}-${item.state}`}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.cityItem}
                      onPress={() => handleSelectCity(item)}
                    >
                      <Text style={styles.cityName}>{item.name}</Text>
                      <Text style={styles.cityState}>{item.state}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* City Result Modal */}
      <Modal
        visible={showCityModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCityModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCityModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.cityModalContainer}>
                <View style={styles.modalHandle} />
                <Text style={styles.cityModalTitle}>
                  {selectedCity?.name}, {selectedCity?.state}
                </Text>

                {colleges.length > 0 ? (
                  colleges.map((college) => (
                    <View key={college} style={styles.collegeRow}>
                      <Text style={styles.collegeName}>{college}</Text>
                      <TouchableOpacity
                        style={styles.joinButton}
                        onPress={() => navigation.navigate('CollegeVerification')}
                      >
                        <Text style={styles.joinButtonText}>Join</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noCommunitiesText}>
                    No communities in your city yet 😔
                  </Text>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}