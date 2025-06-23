import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../libs/supabase'; // Asegúrate que la ruta sea correcta

interface Meal {
  id: number;
  name: string;
  calories: number;
}

interface MealListProps {
  meals: Meal[];
  isLoading: boolean;
  noMealsText?: string; 
}

const deleteMeal = async (mealId: number) => {
  const { error } = await supabase.from('meals').delete().eq('id', mealId);
  if (error) throw new Error(error.message);
};

const MealList: React.FC<MealListProps> = ({
  meals,
  isLoading,
  noMealsText = 'No hay comidas registradas.',
}) => {
  const queryClient = useQueryClient();

  const { mutate: deleteMealMutation } = useMutation({
    mutationFn: deleteMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
    onError: (err) => {
      Alert.alert('Error', 'No se pudo eliminar la comida.');
      console.error(err);
    },
  });

  const handleDeletePress = (meal: Meal) => {
    Alert.alert(
      'Eliminar Comida',
      `¿Estás seguro de que quieres eliminar "${meal.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: () => deleteMealMutation(meal.id),
          style: 'destructive',
        },
      ]
    );
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />;
  }

  if (meals.length === 0) {
    return <Text style={styles.noMealsText}>{noMealsText}</Text>;
  }

  return (
    <View>
      {meals.map((meal) => (
        <Pressable
          key={meal.id}
          style={styles.mealItem}
          onPress={() => router.push(`/edit-meal?id=${meal.id}`)}
          onLongPress={() => handleDeletePress(meal)}
        >
          <Text style={styles.mealName}>{meal.name}</Text>
          <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  mealItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '500',
  },
  mealCalories: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  noMealsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});

export default MealList;