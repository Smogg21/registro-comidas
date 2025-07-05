import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../libs/supabase";
import { getLocalYYYYMMDD } from "../../../libs/dateUtils";
import WeightSummaryCard from "../../../components/WeightSummaryCard";

type WeightEntry = { date: string; weight: number };
type DailyAverages = { [key: string]: number | null };

const fetchWeeklyWeightData = async (): Promise<{
  days: Date[];
  averages: DailyAverages;
}> => {
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

  const firstDayString = getLocalYYYYMMDD(firstDayOfWeek);
  const lastDayString = getLocalYYYYMMDD(lastDayOfWeek);

  const { data, error } = await supabase
    .from("weight_entries")
    .select("date, weight")
    .gte('date', firstDayString)
    .lte('date', lastDayString);

  if (error) throw new Error(error.message);

  const dailyData: { [key: string]: number[] } = {};
  (data as WeightEntry[]).forEach(entry => {
    if (!dailyData[entry.date]) {
      dailyData[entry.date] = [];
    }
    dailyData[entry.date].push(entry.weight);
  });

  const averages: DailyAverages = {};
  for (const date in dailyData) {
    const weights = dailyData[date];
    const sum = weights.reduce((a, b) => a + b, 0);
    averages[date] = sum / weights.length;
  }

  return { days: weekDays, averages };
};

export default function WeeklyWeightScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["weights", "weekly"],
    queryFn: fetchWeeklyWeightData,
  });

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
      <Text style={styles.header}>Progreso Semanal de Peso</Text>
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color="#0000ff"
          style={{ marginTop: 50 }}
        />
      ) : (
        <View style={styles.weekContainer}>
          {data?.days.map((date, index) => {
            const dateString = date.toISOString().split("T")[0];
            const averageWeight = data?.averages[dateString] || null;
            const dayOfWeek = date.toLocaleDateString("es-ES", {
              weekday: "short",
            });

            return (
              <WeightSummaryCard
                key={index}
                day={date.getDate()}
                dayOfWeek={dayOfWeek}
                weight={averageWeight}
              />
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  contentContainer: { padding: 20, paddingBottom: 100, flexGrow: 1, minHeight: '100%' },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  weekContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 300,
  },
});