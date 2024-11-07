import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

// Importamos la librería para gestos
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const GOOGLE_MAPS_APIKEY = 'AIzaSyB8c8sGA9H8s1RtwffWi4vKSSluR4ZZ8eQ';

const RutasSelectionScreen = () => {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [distance, setDistance] = useState(null);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [originSelected, setOriginSelected] = useState(false);

  // Estado para controlar el deslizamiento del botón
  const [offsetX, setOffsetX] = useState(new Animated.Value(0)); // Valor de la posición horizontal del botón
  const [isSliding, setIsSliding] = useState(false); // Estado que indica si el botón está siendo deslizado

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
      if (!originSelected) {
        setOrigin({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
      setLocationLoaded(true); // Marca que la ubicación se ha cargado
    })();
  }, [originSelected]);

  const fetchPlaceDetails = async (placeId) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_APIKEY}`
      );
      const data = await response.json();
      if (data.result && data.result.geometry && data.result.geometry.location) {
        return data.result.geometry.location;
      } else {
        throw new Error('No se pudo obtener la ubicación del lugar');
      }
    } catch (error) {
      console.error("Error al obtener detalles del lugar", error);
      return null;
    }
  };

  const handleOriginSelect = async (data, details) => {
    try {
      if (details && details.place_id) {
        const location = await fetchPlaceDetails(details.place_id);
        if (location) {
          setOrigin({
            latitude: location.lat,
            longitude: location.lng,
          });
          setOriginSelected(true); // Marca que el origen fue seleccionado manualmente
        } else {
          console.error("No se pudieron obtener las coordenadas para el origen");
        }
      } else {
        console.error("Detalles incompletos para el origen", data);
      }
    } catch (error) {
      console.error("Error al seleccionar el origen", error);
    }
  };

  const handleDestinationSelect = async (data, details) => {
    try {
      if (details && details.place_id) {
        const location = await fetchPlaceDetails(details.place_id);
        if (location) {
          setDestination({
            latitude: location.lat,
            longitude: location.lng,
          });
        } else {
          console.error("No se pudieron obtener las coordenadas para el destino");
        }
      } else {
        console.error("Detalles incompletos para el destino", data);
      }
    } catch (error) {
      console.error("Error al seleccionar el destino", error);
    }
  };

  // Función para calcular la distancia en kilómetros entre dos coordenadas
  const calculateDistance = (origin, destination) => {
    const toRad = (value) => (value * Math.PI) / 180;

    const lat1 = origin.latitude;
    const lon1 = origin.longitude;
    const lat2 = destination.latitude;
    const lon2 = destination.longitude;

    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distancia en kilómetros
    return distance.toFixed(2); // Limitar a dos decimales
  };

  // Efecto para calcular la distancia cuando origin o destination cambian
  useEffect(() => {
    if (origin && destination) {
      const dist = calculateDistance(origin, destination);
      setDistance(dist); // Actualiza la distancia
    }
  }, [origin, destination]);

  // Función para manejar el gesto de deslizamiento
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: offsetX } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      // Si el botón llega al final de su recorrido, hacemos algo (por ejemplo, iniciar el viaje)
      if (nativeEvent.translationX > 150) { // Umbral de 150px para "iniciar el viaje"
        alert("Iniciando el viaje...");
      }
      // Resetear el botón a su posición inicial
      Animated.spring(offsetX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        {/* Componente de búsqueda para el origen */}
        <GooglePlacesAutocomplete
          placeholder="Buscar origen"
          onPress={handleOriginSelect}
          query={{
            key: GOOGLE_MAPS_APIKEY,
            language: 'es',
            fields: ['place_id', 'description'], // Solicitamos solo el place_id
          }}
          nearbyPlacesAPI="GooglePlacesSearch"
          debounce={200}
          styles={styles.autocomplete}
        />

        {/* Componente de búsqueda para el destino */}
        <GooglePlacesAutocomplete
          placeholder="Buscar destino"
          onPress={handleDestinationSelect}
          query={{
            key: GOOGLE_MAPS_APIKEY,
            language: 'es',
            fields: ['place_id', 'description'], // Solicitamos solo el place_id
          }}
          nearbyPlacesAPI="GooglePlacesSearch"
          debounce={200}
          styles={styles.autocomplete}
        />
      </View>

      {origin && destination ? (
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
            }}
          />
        </MapView>
      ) : (
        <View style={styles.loading}>
          <Text>{errorMsg || 'Cargando ubicación...'}</Text>
        </View>
      )}

      {/* Mostrar la distancia */}
      {distance && (
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceText}>Distancia: {distance} km</Text>
        </View>
      )}

      {/* Botón deslizable */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View style={[styles.slideButton, { transform: [{ translateX: offsetX }] }]}>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Iniciar Viaje</Text>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '80%',
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
    marginBottom: 20,
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
  distanceContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
  },
  distanceText: {
    color: '#fff',
    fontSize: 18,
  },
  slideButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    width: 200,
    padding: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default RutasSelectionScreen;
