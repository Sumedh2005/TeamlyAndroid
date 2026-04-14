import React, { useState } from 'react';
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
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const TEAMS = ['Kick Off FC', 'Scoregasm FC', 'Super FC'];

export default function ChallengeTeamScreen({ visible, onClose }: Props) {
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState(new Date());
  const [fromTime, setFromTime] = useState(new Date());
  const [toTime, setToTime] = useState(new Date());
  const [isChallenge, setIsChallenge] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (d: Date) =>
    d.toLocaleDateString();

  return (
    <Modal visible={visible} animationType="slide" transparent>

      {/* OUTSIDE CLICK */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.wrapper}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>

            <View style={styles.dragBar} />
            <Text style={styles.title}>Challenge Team</Text>

            {/* Venue */}
            <View style={styles.inputBox}>
              <Text style={styles.icon}>📍</Text>
              <TextInput
                placeholder="Venue"
                value={venue}
                onChangeText={setVenue}
                style={styles.input}
              />
            </View>

            {/* Time */}
            <View style={styles.row}>
              <View style={styles.labelRow}>
                <Ionicons name="time-outline" size={20} color="#34C759" />
                <Text style={styles.label}>Time</Text>
              </View>

              <View style={styles.timeRow}>
                <TouchableOpacity
                  style={styles.timeInput}
                  onPress={() => setShowFromPicker(true)}
                >
                  <Text>{formatTime(fromTime)}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.timeInput}
                  onPress={() => setShowToPicker(true)}
                >
                  <Text>{formatTime(toTime)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date */}
            <View style={styles.row}>
              <View style={styles.labelRow}>
                <Ionicons name="calendar-outline" size={20} color="#34C759" />
                <Text style={styles.label}>Date</Text>
              </View>

              <TouchableOpacity
                style={styles.fullInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text>{formatDate(date)}</Text>
              </TouchableOpacity>
            </View>

            {/* Toggle */}
            <View style={styles.row}>
              <View style={styles.labelRow}>
                <Ionicons name="people-outline" size={20} color="#34C759" />
                <Text style={styles.label}>Challenge</Text>
              </View>

              <Switch value={isChallenge} onValueChange={setIsChallenge} />
            </View>

            {/* 🔥 TEAM LIST (ONLY WHEN TOGGLE ON) */}
            {isChallenge && (
              <View style={styles.teamBox}>
                <FlatList
                  data={TEAMS}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <View style={styles.teamRow}>
                      <Text style={styles.teamText}>{item}</Text>
                      <TouchableOpacity style={styles.sendBtn}>
                        <Text style={styles.sendText}>Send</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>
            )}

            {/* Button */}
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Challenge</Text>
            </TouchableOpacity>

          </View>
        </TouchableWithoutFeedback>
      </View>

      {/* PICKERS */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(e, selected) => {
            setShowDatePicker(false);
            if (selected) setDate(selected);
          }}
        />
      )}

      {showFromPicker && (
        <DateTimePicker
          value={fromTime}
          mode="time"
          display="default"
          onChange={(e, selected) => {
            setShowFromPicker(false);
            if (selected) setFromTime(selected);
          }}
        />
      )}

      {showToPicker && (
        <DateTimePicker
          value={toTime}
          mode="time"
          display="default"
          onChange={(e, selected) => {
            setShowToPicker(false);
            if (selected) setToTime(selected);
          }}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },

  wrapper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },

  container: {
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },

  dragBar: {
    width: 40,
    height: 5,
    backgroundColor: '#C7C7CC',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginBottom: 16,
  },

  icon: { marginRight: 8 },

  input: { flex: 1, paddingVertical: 10 },

  row: { marginBottom: 16 },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
  },

  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },

  timeInput: {
    flex: 1,
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
  },

  fullInput: {
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
    padding: 12,
  },

  /* TEAM LIST */
  teamBox: {
    backgroundColor: '#D1D1D6',
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
  },

  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
    padding: 12,
    marginBottom: 10,
  },

  teamText: {
    fontSize: 16,
    fontWeight: '500',
  },

  sendBtn: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },

  sendText: {
    color: '#fff',
    fontWeight: '600',
  },

  button: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});