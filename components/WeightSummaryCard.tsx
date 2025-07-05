
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

interface WeightSummaryCardProps {
  day: number;
  dayOfWeek: string;
  weight: number | null;
  onPress?: () => void;
}

const WeightSummaryCard: React.FC<WeightSummaryCardProps> = ({ day, dayOfWeek, weight, onPress }) => {
  const containerStyle = [
    styles.container,
    { backgroundColor: weight ? '#2196F3' : '#cccccc' } // Azul si hay peso, gris si no
  ];

  return (
    <Pressable style={containerStyle} onPress={onPress} disabled={!onPress}>
      <Text style={styles.dayOfWeek}>{dayOfWeek}</Text>
      <Text style={styles.dayNumber}>{day}</Text>
      <Text style={styles.weight}>
        {weight ? `${weight.toFixed(1)} kg` : '---'}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 100,
    margin: 5,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  dayOfWeek: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    marginVertical: 4,
  },
  weight: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
});

export default WeightSummaryCard;
