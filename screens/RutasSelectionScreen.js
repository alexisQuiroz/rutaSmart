import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const GOOGLE_MAPS_APIKEY = 'AIzaSyB8c8sGA9H8s1RtwffWi4vKSSluR4ZZ8eQ';

const RutasSelectionScreen = () => {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(null);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Función para obtener detalles de un lugar, basada en la función fetchPlaceDetails
  const fetchPlaceDetails = async (placeId) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${GOOGLE_MAPS_APIKEY}`
      );
      const result = await response.json();
      const location = result.result.geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    } catch (error) {
      console.log("Error al obtener detalles del lugar:", error);
      return null;
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado');
        return;
      }
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setOrigin({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLocationLoaded(true);
    })();
  }, []);

  const handleDestinationSelect = async (data) => {
    const placeDetails = await fetchPlaceDetails(data.place_id);
    if (placeDetails) {
      setDestination(placeDetails);
    } else {
      console.log("Error: No se pudieron obtener detalles de la ubicación para el destino");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <GooglePlacesAutocomplete
          placeholder="Buscar destino"
          onPress={(data) => handleDestinationSelect(data)}
          query={{
            key: GOOGLE_MAPS_APIKEY,
            language: 'es',
          }}
          nearbyPlacesAPI="GooglePlacesSearch"
          debounce={200}
          styles={styles.autocomplete}
        />
      </View>

      {locationLoaded && origin ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: origin.latitude,
            longitude: origin.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker coordinate={origin} title="Ubicación Actual" description="Este es tu punto de inicio" />

          {destination && (
            <>
              <Marker coordinate={destination} title="Destino" />
              <MapViewDirections
                origin={origin}
                destination={destination}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={4}
                strokeColor="blue"
                onReady={(result) => {
                  setDistance(result.distance);
                }}
                onError={(error) => {
                  console.log("Error al obtener la dirección:", error);
                }}
              />
            </>
          )}
        </MapView>
      ) : (
        <View style={styles.loading}>
          <Text>{errorMsg || 'Cargando ubicación actual...'}</Text>
        </View>
      )}

      {distance && (
        <View style={styles.infoContainer}>
          <Text style={styles.distanceText}>Distancia: {distance.toFixed(2)} km</Text>
          <TouchableOpacity style={styles.startTripButton}>
            <Text style={styles.startTripButtonText}>Desliza para comenzar el viaje</Text>
          </TouchableOpacity>
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
  searchContainer: {
    position: 'absolute',
    top: 20,
    left: 10,
    right: 10,
    zIndex: 1,
  },
  autocomplete: {
    container: {
      flex: 0,
      marginBottom: 10,
    },
    textInput: {
      height: 40,
      backgroundColor: '#fff',
      borderRadius: 5,
      paddingLeft: 10,
      marginBottom: 10,
      fontSize: 16,
    },
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  startTripButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2196F3',
    borderRadius: 5,
  },
  startTripButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default RutasSelectionScreen;
