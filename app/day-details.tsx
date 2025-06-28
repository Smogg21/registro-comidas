import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Button,
  Alert,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../libs/supabase';
import { Stack } from 'expo-router';
import MealList from '../components/MealList';
import { Picker } from '@react-native-picker/picker';

const MEAL_TYPES = ["Snack", "Desayuno", "Almuerzo", "Cena"];

interface Meal {
  id: number;
  name: string;
  calories: number;
  type?: string;
}

const fetchMealsByDate = async (date: string): Promise<Meal[]> => {
  const { data, error } = await supabase
    .from('meals')
    .select('id, name, calories, type')
    .eq('date', date);

  if (error) throw new Error(error.message);
  return data || [];
};

const addMeal = async ({
  name,
  calories,
  type,
  date,
}: {
  name: string;
  calories: number;
  type: string;
  date: string;
}) => {
  const { error } = await supabase.from("meals").insert([
    {
      name,
      calories,
      date,
      type,
    },
  ]);

  if (error) throw new Error(error.message);
};

export default function DayDetailsScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const queryClient = useQueryClient();

  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [mealType, setMealType] = useState(MEAL_TYPES[0]);

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

  const { mutate: addMealMutation } = useMutation({
    mutationFn: addMeal,
    onSuccess: () => {
      setMealName("");
      setCalories("");
      setMealType(MEAL_TYPES[0]);
      queryClient.invalidateQueries({ queryKey: ["meals", "by-date", date] });
      queryClient.invalidateQueries({ queryKey: ["meals", "weekly"] });
      queryClient.invalidateQueries({ queryKey: ["meals", "monthly"] });
    },
    onError: (err) => {
      Alert.alert("Error", "No se pudo guardar la comida.");
      console.error(err);
    },
  });

  const handleAddMeal = () => {
    const caloriesNumber = parseInt(calories, 10);
    if (!mealName.trim() || isNaN(caloriesNumber) || caloriesNumber <= 0) {
      Alert.alert(
        "Datos Inválidos",
        "Por favor, ingresa un nombre y un número de calorías válido."
      );
      return;
    }
    Keyboard.dismiss();
    addMealMutation({
      name: mealName.trim(),
      calories: caloriesNumber,
      type: mealType,
      date: date!,
    });
  };

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

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nombre de la comida (ej: Pan con pollo)"
          value={mealName}
          onChangeText={setMealName}
          placeholderTextColor="#999"
        />
        <TextInput
          style={styles.input}
          placeholder="Calorías (ej: 300)"
          value={calories}
          onChangeText={setCalories}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={mealType}
            onValueChange={(itemValue) => setMealType(itemValue)}
            style={{ color: "#999" }}
          >
            {MEAL_TYPES.map((type) => (
              <Picker.Item key={type} label={type} value={type} />
            ))}
          </Picker>
        </View>
        <Button title="Agregar Comida" onPress={handleAddMeal} />
      </View>

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
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  pickerContainer: {
    height: 50,
    justifyContent: "center",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
  },
});