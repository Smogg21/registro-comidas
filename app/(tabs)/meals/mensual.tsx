import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../libs/supabase";
import DaySummaryCard from "../../../components/DaySummaryCard";
import { getLocalYYYYMMDD } from "../../../libs/dateUtils";

type MealData = { date: string; calories: number };
type DailyTotals = { [key: string]: number };

const fetchMonthlyData = async (): Promise<{
  days: Date[];
  totals: DailyTotals;
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
    .from("meals")
    .select("date, calories")
    .gte('date', firstDayString) 
    .lte('date', lastDayString);

  if (error) throw new Error(error.message);

  const totals = (data as MealData[]).reduce((acc, meal) => {
    acc[meal.date] = (acc[meal.date] || 0) + meal.calories;
    return acc;
  }, {} as DailyTotals);

  return { days: monthDays, totals };
};

export default function MonthlyScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["meals", "monthly"],
    queryFn: fetchMonthlyData,
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
      <Text style={styles.header}>Progreso Mensual</Text>
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
            const totalCalories = data?.totals[dateString] || 0;
            const dayOfWeek = date.toLocaleDateString("es-ES", {
              weekday: "short",
            });

            return (
              <DaySummaryCard
                key={index}
                day={date.getDate()}
                dayOfWeek={dayOfWeek}
                totalCalories={totalCalories}
                onPress={
                  totalCalories > 0
                    ? () => router.push(`/day-details?date=${dateString}`)
                    : undefined
                }
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