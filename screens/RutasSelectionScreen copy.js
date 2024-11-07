import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import MapViewDirections from 'react-native-maps-directions';

const GOOGLE_MAPS_APIKEY = 'AIzaSyB8c8sGA9H8s1RtwffWi4vKSSluR4ZZ8eQ';

const RutasSelectionScreen = () => {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState({
    latitude: -33.447055540026135,  // San Francisco latitude
    longitude: -70.64935529499316// San Francisco longitude
    
  });
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    (async () => {
      // Solicitar permisos de ubicación
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado');
        return;
      }

      // Obtener la ubicación actual
      let location = await Location.getCurrentPositionAsync({});
      setOrigin({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      {origin ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: origin.latitude,
            longitude: origin.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker coordinate={origin} title="Origen" description="Ubicación actual" />
          <Marker coordinate={destination} title="Destino" description="Destino" />

          {/* Componente para mostrar la ruta */}
          <MapViewDirections
  origin={origin}
  destination={destination}
  apikey={GOOGLE_MAPS_APIKEY}
  strokeWidth={4}
  strokeColor="blue"
  onError={(error) => {
    console.log("Error al obtener la dirección:", error);
    alert('Error al obtener la dirección: ' + error.message);
  }}
/>
        </MapView>
      ) : (
        <View style={styles.loading}>
          <Text>{errorMsg || "Cargando ubicación..."}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RutasSelectionScreen;
