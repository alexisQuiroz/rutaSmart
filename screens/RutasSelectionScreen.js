import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const RutasSelectionScreen = () => {
  const [region, setRegion] = useState(null);
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
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      {region ? (
        <MapView style={styles.map} region={region}>
          <Marker
            coordinate={{ latitude: region.latitude, longitude: region.longitude }}
            title="Tu ubicación"
            description="Aquí estás"
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
