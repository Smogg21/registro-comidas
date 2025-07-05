
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function MainTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'blue',
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="meals"
        options={{
          title: 'Comidas',
          headerShown: false,
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="cutlery" color={color} />,
        }}
      />
      <Tabs.Screen
        name="weight"
        options={{
          title: 'Peso',
          headerShown: false,
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="balance-scale" color={color} />,
        }}
      />
    </Tabs>
  );
}
