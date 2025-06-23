import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DaySummaryCardProps {
  day: number;          
  dayOfWeek: string;    
  totalCalories: number;
}

const DaySummaryCard: React.FC<DaySummaryCardProps> = ({ day, dayOfWeek, totalCalories }) => {
  const getColor = () => {
    if (totalCalories === 0) return '#cccccc'; // Gris - Sin registro
    if (totalCalories < 2000) return '#4caf50'; // Verde
    if (totalCalories <= 2500) return '#ff9800'; // Naranja
    return '#f44336'; // Rojo
  };

  const containerStyle = [
    styles.container,
    { backgroundColor: getColor() }
  ];

  return (
    <View style={containerStyle}>
      <Text style={styles.dayOfWeek}>{dayOfWeek}</Text>
      <Text style={styles.dayNumber}>{day}</Text>
      <Text style={styles.calories}>
        {totalCalories > 0 ? `${totalCalories} kcal` : '---'}
      </Text>
    </View>
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
  calories: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
});

export default DaySummaryCard;