import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Keyboard,
  RefreshControl,
  FlatList,
} from "react-native";
import { supabase } from "../../../libs/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getLocalYYYYMMDD } from "../../../libs/dateUtils";

interface WeightEntry {
  id: number;
  weight: number;
  created_at: string;
}

const fetchDailyWeight = async (): Promise<WeightEntry[]> => {
  const todayDateString = getLocalYYYYMMDD(new Date());

  const { data, error } = await supabase
    .from("weight_entries")
    .select("*")
    .eq("date", todayDateString)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

const addWeight = async ({ weight }: { weight: number }) => {
  const localDateString = getLocalYYYYMMDD(new Date());
  const { error } = await supabase.from("weight_entries").insert([
    {
      weight,
      date: localDateString,
    },
  ]);

  if (error) throw new Error(error.message);
};

export default function DailyWeightScreen() {
  const [weight, setWeight] = useState("");
  const queryClient = useQueryClient();

  const { data: weights = [], isLoading, error, refetch } = useQuery({
    queryKey: ["weights", "daily"],
    queryFn: fetchDailyWeight,
  });

  const { mutate: addWeightMutation } = useMutation({
    mutationFn: addWeight,
    onSuccess: () => {
      setWeight("");
      queryClient.invalidateQueries({ queryKey: ["weights", "daily"] });
      queryClient.invalidateQueries({ queryKey: ["weights", "weekly"] });
      queryClient.invalidateQueries({ queryKey: ["weights", "monthly"] });
    },
    onError: (err) => {
      Alert.alert("Error", "No se pudo guardar el peso.");
      console.error(err);
    },
  });

  const handleAddWeight = () => {
    const weightNumber = parseFloat(weight);
    if (isNaN(weightNumber) || weightNumber <= 0) {
      Alert.alert(
        "Dato Inválido",
        "Por favor, ingresa un peso válido."
      );
      return;
    }
    Keyboard.dismiss();
    addWeightMutation({ weight: weightNumber });
  };

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
    <FlatList
      data={weights}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.itemContainer}>
          <Text style={styles.itemText}>{item.weight} kg</Text>
          <Text style={styles.itemTime}>{new Date(item.created_at).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          })}</Text>
        </View>
      )}
      ListHeaderComponent={
        <WeightListHeader
          weight={weight}
          setWeight={setWeight}
          handleAddWeight={handleAddWeight}
        />
      }
      ListEmptyComponent={<Text>No hay pesos registrados hoy.</Text>}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
      style={styles.container}
    />
  );
}

interface WeightListHeaderProps {
  weight: string;
  setWeight: (text: string) => void;
  handleAddWeight: () => void;
}

const WeightListHeader: React.FC<WeightListHeaderProps> = ({
  weight,
  setWeight,
  handleAddWeight,
}) => {
  return (
    <View style={styles.contentContainer}>
      <Text style={styles.header}>Registro de Peso Diario</Text>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Peso (ej: 70.5)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
        <Button title="Agregar Peso" onPress={handleAddWeight} />
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Pesos de Hoy</Text>
      </View>
    </View>
  );
};

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
  listContainer: {
    marginTop: 10,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 16,
  },
  itemTime: {
    fontSize: 14,
    color: '#666',
  },
});
