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

const fetchMonthlyWeightData = async (): Promise<{
  days: Date[];
  averages: DailyAverages;
}> => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const monthDays: Date[] = [];
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    monthDays.push(new Date(now.getFullYear(), now.getMonth(), i));
  }

  const firstDayString = getLocalYYYYMMDD(firstDayOfMonth);
  const lastDayString = getLocalYYYYMMDD(lastDayOfMonth);

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

  return { days: monthDays, averages };
};

export default function MonthlyWeightScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["weights", "monthly"],
    queryFn: fetchMonthlyWeightData,
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
      <Text style={styles.header}>Progreso Mensual de Peso</Text>
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color="#0000ff"
          style={{ marginTop: 50 }}
        />
      ) : (
        <View style={styles.monthContainer}>
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
  contentContainer: { padding: 10 },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 20,
    textAlign: "center",
  },
  monthContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
});