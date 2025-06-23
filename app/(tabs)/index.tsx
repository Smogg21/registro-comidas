import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../libs/supabase';

interface Meal {
  id: number;
  name: string;
  calories: number;
  created_at: string;
}

export default function DailyScreen() {
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);


  const fetchTodaysMeals = async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .gte('created_at', today.toISOString()) // gte = greater than or equal
      .order('created_at', { ascending: false }); // Las más nuevas primero

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar las comidas.');
      console.error(error);
    } else {
      setMeals(data || []);
    }
    setLoading(false);
  };
  
  // Usamos useFocusEffect para que los datos se recarguen cada vez que la pantalla esté en foco
  // Útil para agregar una comida, navegar a otra pestaña y volver.
  useFocusEffect(
    useCallback(() => {
      fetchTodaysMeals();
    }, [])
  );
  
  const handleAddMeal = async () => {
    if (!mealName.trim() || !calories.trim()) {
      Alert.alert('Campos incompletos', 'Por favor, ingresa el nombre y las calorías.');
      return;
    }

    const caloriesNumber = parseInt(calories, 10);
    if (isNaN(caloriesNumber) || caloriesNumber <= 0) {
      Alert.alert('Valor inválido', 'Por favor, ingresa un número válido para las calorías.');
      return;
    }

    Keyboard.dismiss(); 

    const { error } = await supabase
      .from('meals')
      .insert([{ 
        name: mealName.trim(), 
        calories: caloriesNumber,
        date: new Date().toISOString().split('T')[0] // Guarda solo la fecha YYYY-MM-DD
      }]);

    if (error) {
      Alert.alert('Error', 'No se pudo guardar la comida.');
      console.error(error);
    } else {
      setMealName('');
      setCalories('');
      fetchTodaysMeals(); 
    }
  };

  const totalCalories = useMemo(() => {
    return meals.reduce((sum, meal) => sum + meal.calories, 0);
  }, [meals]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>Registro Diario</Text>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nombre de la comida (ej: Pan con pollo)"
          value={mealName}
          onChangeText={setMealName}
        />
        <TextInput
          style={styles.input}
          placeholder="Calorías (ej: 300)"
          value={calories}
          onChangeText={setCalories}
          keyboardType="numeric"
        />
        <Button title="Agregar Comida" onPress={handleAddMeal} />
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Resumen del Día</Text>
        <Text style={styles.totalCalories}>{totalCalories} / 2000 kcal</Text>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Comidas de Hoy</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
        ) : meals.length === 0 ? (
          <Text style={styles.noMealsText}>Aún no has registrado comidas hoy.</Text>
        ) : (
          meals.map((meal) => (
            <View key={meal.id} style={styles.mealItem}>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  summaryContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  totalCalories: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4caf50', 
    marginTop: 5,
  },
  listContainer: {
    marginTop: 10,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
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