import React from 'react';
import { Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../libs/supabase';
import { Stack } from 'expo-router';
import MealList from '../components/MealList';

interface Meal {
  id: number;
  name: string;
  calories: number;
}

const fetchMealsByDate = async (date: string): Promise<Meal[]> => {
  const { data, error } = await supabase
    .from('meals')
    .select('id, name, calories')
    .eq('date', date);

  if (error) throw new Error(error.message);
  return data || [];
};

export default function DayDetailsScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();

  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const { data: meals, isLoading, error } = useQuery({
    queryKey: ['meals', 'by-date', date],
    queryFn: () => fetchMealsByDate(date!),
    enabled: !!date,
  });

  if (isLoading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: formattedDate }} />

      <Text style={styles.header}>Resumen del día</Text>
      <MealList 
        meals={meals || []} 
        isLoading={isLoading} 
        noMealsText="No hay comidas registradas para este día."
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333'
  },
  noMealsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
});