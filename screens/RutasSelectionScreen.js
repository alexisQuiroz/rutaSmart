import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_API_KEY } from '../env';

const { width, height } = Dimensions.get('window');

const RutasSelectionScreen = () => {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [buttonText, setButtonText] = useState('Iniciar Viaje');
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(null);

  const fetchPlaceDetails = async (placeId) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${GOOGLE_MAPS_API_KEY}`
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

  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1E5,
        longitude: lng / 1E5,
      });
    }
    return points;
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setOrigin({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLocationLoaded(true);
    })();
  }, []);

  useEffect(() => {
    const fetchRoutes = async () => {
      if (!origin || !destination) return;

      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&alternatives=true&key=${GOOGLE_MAPS_API_KEY}`
        );
        const result = await response.json();

        if (result.routes && result.routes.length > 0) {
          const newRoutes = result.routes.map((route, index) => {
            const leg = route.legs[0];
            const coordinates = decodePolyline(route.overview_polyline.points);
            const middleIndex = Math.floor(coordinates.length / 2);
            return {
              coordinates,
              middlePoint: coordinates[middleIndex],
              distance: leg.distance ? leg.distance.text : "No disponible",
              duration: leg.duration ? leg.duration.text : "No disponible",
              color: index === 0 ? 'blue' : index === 1 ? 'green' : 'purple',
            };
          });
          setRoutes(newRoutes);
        } else {
          console.log("No se encontraron rutas alternativas.");
        }
      } catch (error) {
        console.log("Error al obtener rutas alternativas:", error);
      }
    };
    fetchRoutes();
  }, [origin, destination]);

  const handleDestinationSelect = async (data) => {
    const placeDetails = await fetchPlaceDetails(data.place_id);
    if (placeDetails) {
      setDestination(placeDetails);
    } else {
      console.log("Error: No se pudieron obtener detalles de la ubicación para el destino");
    }
  };

  const handleRouteSelect = (index) => {
    setSelectedRouteIndex(index);
    setButtonText(`Ruta ${index + 1} Seleccionada`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <GooglePlacesAutocomplete
          placeholder="Buscar destino"
          onPress={(data) => handleDestinationSelect(data)}
          query={{
            key: GOOGLE_MAPS_API_KEY,
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
          region={{
            latitude: origin.latitude,
            longitude: origin.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsTraffic={true}
        >
          {/* Marker para la ubicación de origen */}
          {origin && (
            <Marker
              coordinate={origin}
              title="Ubicación Actual"
              description="Este es tu punto de inicio"
              pinColor="blue"
            />
          )}

          {/* Marker para la ubicación de destino */}
          {destination && (
            <Marker
              coordinate={destination}
              title="Destino"
              description="Este es tu destino"
              pinColor="red"
            />
          )}

          {routes.map((route, index) => (
            <React.Fragment key={index}>
              <Polyline
                coordinates={route.coordinates}
                strokeColor={route.color}
                strokeWidth={4}
                tappable={true}
                onPress={() => handleRouteSelect(index)}
              />
              
              {/* Static tooltip positioned at the middle of each route */}
              <Marker
                coordinate={route.middlePoint}
                anchor={{ x: 0.5, y: 1 }}
              >
                <TouchableOpacity onPress={() => handleRouteSelect(index)}>
                  <View style={[styles.tooltipContainer, { borderColor: route.color }]}>
                    <Text style={styles.tooltipText}>{`Ruta ${index + 1}`}</Text>
                    <Text style={styles.tooltipText}>{`${route.duration} • ${route.distance}`}</Text>
                  </View>
                </TouchableOpacity>
              </Marker>
            </React.Fragment>
          ))}
        </MapView>
      ) : (
        <View style={styles.loading}>
          <Text>{errorMsg || 'Cargando ubicación actual...'}</Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <TouchableOpacity style={styles.startTripButton}>
          <Text style={styles.startTripButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
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
  tooltipContainer: {
    padding: 8,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  tooltipText: {
    fontSize: 12,
    color: '#000',
    fontWeight: 'bold',
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
  startTripButton: {
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
``
