import React, { useState, useMemo, useCallback } from "react";
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
  RefreshControl,
  Pressable,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "../../libs/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface Meal {
  id: number;
  name: string;
  calories: number;
  created_at: string;
}

const fetchDailyMeals = async (): Promise<Meal[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .gte("created_at", today.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message); // TanStack Query maneja los errores así
  return data || [];
};

const addMeal = async ({
  name,
  calories,
}: {
  name: string;
  calories: number;
}) => {
  const { error } = await supabase.from("meals").insert([
    {
      name,
      calories,
      date: new Date().toISOString().split("T")[0],
    },
  ]);

  if (error) throw new Error(error.message);
};

const deleteMeal = async (mealId: number) => {
  const { error } = await supabase.from("meals").delete().eq("id", mealId);
  if (error) throw new Error(error.message);
};

export default function DailyScreen() {
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const queryClient = useQueryClient();

  const {
    data: meals = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["meals", "daily"],
    queryFn: fetchDailyMeals,
  });

  const { mutate: addMealMutation } = useMutation({
    mutationFn: addMeal,
    onSuccess: () => {
      setMealName("");
      setCalories("");
      queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
    onError: (err) => {
      Alert.alert("Error", "No se pudo guardar la comida.");
      console.error(err);
    },
  });

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

  const handleAddMeal = () => {
    const caloriesNumber = parseInt(calories, 10);
    Keyboard.dismiss();
    addMealMutation({ name: mealName.trim(), calories: caloriesNumber });
  };

   const handleDeletePress = (meal: Meal) => {
    Alert.alert(
      'Eliminar Comida', 
      `¿Estás seguro de que quieres eliminar "${meal.name}"?`, 
      [ 
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          onPress: () => deleteMealMutation(meal.id), 
          style: 'destructive',
        },
      ]
    );
  };

  const totalCalories = useMemo(() => {
    return meals.reduce((sum, meal) => sum + meal.calories, 0);
  }, [meals]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (error) {
    return <Text>Ocurrió un error: {error.message}</Text>;
  }
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
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
        {isLoading ? ( // Usamos `isLoading` de useQuery
          <ActivityIndicator
            size="large"
            color="#0000ff"
            style={{ marginTop: 20 }}
          />
        ) : meals.length === 0 ? (
          <Text style={styles.noMealsText}>
            Haz pull-down para refrescar o agrega una comida.
          </Text>
        ) : (
          meals.map((meal) => (
            <Pressable 
              key={meal.id} 
              style={styles.mealItem}
              onLongPress={() => handleDeletePress(meal)}
            >
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
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
  summaryContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  totalCalories: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4caf50",
    marginTop: 5,
  },
  listContainer: {
    marginTop: 10,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  mealItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "500",
  },
  mealCalories: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
  },
  noMealsText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },
});
