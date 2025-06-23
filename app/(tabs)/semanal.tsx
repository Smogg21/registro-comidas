import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../libs/supabase';
import DaySummaryCard from '../../components/DaySummaryCard';

// Mapa para almacenar los datos agregados: { 'YYYY-MM-DD': totalCalories }
type DailyTotals = { [key: string]: number };

export default function WeeklyScreen() {
  const [loading, setLoading] = useState(true);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({});
  const [currentWeekDays, setCurrentWeekDays] = useState<Date[]>([]);

  const fetchWeeklyData = async () => {
    setLoading(true);

    const now = new Date();
    const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const lastDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    
    firstDayOfWeek.setHours(0, 0, 0, 0);
    lastDayOfWeek.setHours(23, 59, 59, 999);

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(firstDayOfWeek);
        day.setDate(day.getDate() + i);
        weekDays.push(day);
    }
    setCurrentWeekDays(weekDays);

    const { data, error } = await supabase
      .from('meals')
      .select('date, calories')
      .gte('date', firstDayOfWeek.toISOString().split('T')[0])
      .lte('date', lastDayOfWeek.toISOString().split('T')[0]);

    if (error) {
      Alert.alert('Error', 'No se pudo cargar el resumen semanal.');
      console.error(error);
      setLoading(false);
      return;
    }

    // Agrupar calorías por día
    const totals = data.reduce((acc, meal) => {
      const date = meal.date; 
      acc[date] = (acc[date] || 0) + meal.calories;
      return acc;
    }, {} as DailyTotals);

    setDailyTotals(totals);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchWeeklyData();
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>Progreso Semanal</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 50 }}/>
      ) : (
        <View style={styles.weekContainer}>
          {currentWeekDays.map((date, index) => {
            const dateString = date.toISOString().split('T')[0];
            const totalCalories = dailyTotals[dateString] || 0;
            const dayOfWeek = date.toLocaleDateString('es-ES', { weekday: 'short' });
            
            return (
              <DaySummaryCard
                key={index}
                day={date.getDate()}
                dayOfWeek={dayOfWeek}
                totalCalories={totalCalories}
              />
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  contentContainer: { padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  weekContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});