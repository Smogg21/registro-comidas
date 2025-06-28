import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  Keyboard,
  RefreshControl,
} from "react-native";
import { supabase } from "../../libs/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import MealList from "../../components/MealList";
import { Picker } from "@react-native-picker/picker";
import { getLocalYYYYMMDD } from "../../libs/dateUtils";

const MEAL_TYPES = ["Snack", "Desayuno", "Almuerzo", "Cena"];

interface Meal {
  id: number;
  name: string;
  calories: number;
  created_at: string;
}

const fetchDailyMeals = async (): Promise<Meal[]> => {
  const todayDateString = getLocalYYYYMMDD(new Date());

  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("date", todayDateString)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

const addMeal = async ({
  name,
  calories,
  type,
}: {
  name: string;
  calories: number;
  type: string;
}) => {
  const localDateString = getLocalYYYYMMDD(new Date());
  const { error } = await supabase.from("meals").insert([
    {
      name,
      calories,
      date: localDateString,
      type,
    },
  ]);

  if (error) throw new Error(error.message);
};

export default function DailyScreen() {
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const queryClient = useQueryClient();
  const [mealType, setMealType] = useState(MEAL_TYPES[0]);

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
      setMealType(MEAL_TYPES[0]);
      queryClient.invalidateQueries({ queryKey: ["meals", "daily"] });
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
    });
  };

  const totalCalories = useMemo(() => {
    return meals.reduce((sum, meal) => sum + meal.calories, 0);
  }, [meals]);

  const getColor = () => {
    if (totalCalories === 0) return "#cccccc";
    if (totalCalories < 2000) return "#4caf50";
    if (totalCalories <= 2500) return "#ff9800";
    return "#f44336";
  };
  const caloriesStyle = [styles.totalCalories, { color: getColor() }];

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
            style={{color: "#999"}}
          >
            {MEAL_TYPES.map((type) => (
              <Picker.Item key={type} label={type} value={type} />
            ))}
          </Picker>
        </View>
        <Button title="Agregar Comida" onPress={handleAddMeal} />
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Resumen del Día</Text>
        <Text style={caloriesStyle}>{totalCalories} / 2000 kcal</Text>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Comidas de Hoy</Text>

        <MealList
          meals={meals}
          isLoading={isLoading}
          noMealsText="Haz pull-down para refrescar o agrega una comida."
        />
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
  pickerContainer: {
    height: 50,
    justifyContent: "center",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
  },
});
