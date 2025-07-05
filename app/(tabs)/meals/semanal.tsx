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
import { router } from "expo-router";
import DaySummaryCard from "../../../components/DaySummaryCard";
import { getLocalYYYYMMDD } from "../../../libs/dateUtils";

type MealData = { date: string; calories: number };
type DailyTotals = { [key: string]: number };

const fetchWeeklyData = async (): Promise<{
  days: Date[];
  totals: DailyTotals;
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
    .from("meals")
    .select("date, calories")
    .gte('date', firstDayString)
    .lte('date', lastDayString);

  if (error) throw new Error(error.message);

  const totals = (data as MealData[]).reduce((acc, meal) => {
    acc[meal.date] = (acc[meal.date] || 0) + meal.calories;
    return acc;
  }, {} as DailyTotals);

  return { days: weekDays, totals };
};

export default function WeeklyScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["meals", "weekly"],
    queryFn: fetchWeeklyData,
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
      <Text style={styles.header}>Progreso Semanal</Text>
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