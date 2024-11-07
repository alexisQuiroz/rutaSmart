import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import RutasSelectionScreen from './screens/RutasSelectionScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Inicio' }}
        />
        <Stack.Screen
          name="RutasSelection"
          component={RutasSelectionScreen}
          options={{ title: 'Seleccionar Ruta' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
