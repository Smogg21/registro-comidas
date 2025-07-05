
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function MealsTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'blue',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Diario',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="book" color={color} />,
        }}
      />
      <Tabs.Screen
        name="semanal"
        options={{
          title: 'Semanal',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="mensual"
        options={{
          title: 'Mensual',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="bar-chart" color={color} />,
        }}
      />
    </Tabs>
  );
}
