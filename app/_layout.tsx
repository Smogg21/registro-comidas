// app/_layout.tsx
import { Stack } from 'expo-router';
import { supabase } from '../libs/supabase';


export default function RootLayout() {
  
  return (
      <Stack>
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false 
          }} 
        />
      </Stack>
  );
}