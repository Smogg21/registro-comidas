import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../libs/supabase'; 


const fetchMealById = async (id: number) => {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('id', id)
    .single(); 

  if (error) throw new Error(error.message);
  return data;
};

const updateMeal = async ({ id, name, calories }: { id: number; name: string; calories: number }) => {
  const { error } = await supabase
    .from('meals')
    .update({ name, calories })
    .eq('id', id);

  if (error) throw new Error(error.message);
};

export default function EditMealScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // Obtiene el ID de la URL
  const mealId = Number(id);

  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');

  const { data: meal, isLoading, error } = useQuery({
    queryKey: ['meal', mealId],
    queryFn: () => fetchMealById(mealId),
    enabled: !!mealId, 
  });

  useEffect(() => {
    if (meal) {
      setName(meal.name);
      setCalories(String(meal.calories));
    }
  }, [meal]);

  const { mutate: updateMealMutation } = useMutation({
    mutationFn: updateMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['meal', mealId] });
      Alert.alert('Éxito', 'Los cambios han sido guardados.');
      router.back(); 
    },
    onError: (err) => {
      Alert.alert('Error', 'No se pudieron guardar los cambios.');
      console.error(err);
    },
  });

  const handleSaveChanges = () => {
    const caloriesNumber = parseInt(calories, 10);
    if (!name.trim() || isNaN(caloriesNumber) || caloriesNumber <= 0) {
      Alert.alert('Datos inválidos', 'Por favor, revisa los datos ingresados.');
      return;
    }
    updateMealMutation({ id: mealId, name: name.trim(), calories: caloriesNumber });
  };
  
  if (isLoading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (error) {
    return <Text>Error al cargar la comida: {error.message}</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Editar Comida</Text>
      <View style={styles.formContainer}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
        />
        <Text style={styles.label}>Calorías</Text>
        <TextInput
          style={styles.input}
          value={calories}
          onChangeText={setCalories}
          keyboardType="numeric"
        />
        <Button title="Guardar Cambios" onPress={handleSaveChanges} />
      </View>
    </ScrollView>
  );
}

// Estilos similares a los de DailyScreen pero adaptados
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, },
    header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', },
    formContainer: { backgroundColor: '#fff', borderRadius: 8, padding: 20, },
    label: { fontSize: 16, fontWeight: '500', marginBottom: 5, },
    input: { height: 50, borderColor: '#ddd', borderWidth: 1, borderRadius: 8, marginBottom: 20, paddingHorizontal: 15, fontSize: 16, },
});