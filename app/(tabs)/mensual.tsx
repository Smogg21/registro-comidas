import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../libs/supabase';
import DaySummaryCard from '../../components/DaySummaryCard';

type DailyTotals = { [key: string]: number };

export default function MonthlyScreen() {
  const [loading, setLoading] = useState(true);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({});
  const [currentMonthDays, setCurrentMonthDays] = useState<Date[]>([]);

  const fetchMonthlyData = async () => {
    setLoading(true);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthDays: Date[] = [];
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        monthDays.push(new Date(now.getFullYear(), now.getMonth(), i));
    }
    setCurrentMonthDays(monthDays);
    
    const { data, error } = await supabase
      .from('meals')
      .select('date, calories')
      .gte('date', firstDayOfMonth.toISOString().split('T')[0])
      .lte('date', lastDayOfMonth.toISOString().split('T')[0]);

    if (error) {
      Alert.alert('Error', 'No se pudo cargar el resumen mensual.');
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
      fetchMonthlyData();
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>Progreso Mensual</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 50 }} />
      ) : (
        <View style={styles.monthContainer}>
          {currentMonthDays.map((date, index) => {
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
  contentContainer: { padding: 10 },
  header: { fontSize: 28, fontWeight: 'bold', marginVertical: 20, textAlign: 'center' },
  monthContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});