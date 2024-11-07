// screens/RouteSelectionScreen.js
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const RouteSelectionScreen = ({ navigation }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationSelect = (data, details) => {
    const { lat, lng } = details.geometry.location;
    setSelectedLocation({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seleccionar Ruta</Text>
      
      {/* Barra de búsqueda de lugares */}
      <GooglePlacesAutocomplete
        placeholder="Buscar dirección"
        onPress={handleLocationSelect}
        query={{
          key: 'AIzaSyD3TbImlZkbseGEs7smYVAw_Uzk5tIxNuc', // Reemplaza con tu clave de API de Google
          language: 'es',
        }}
        fetchDetails={true}
        styles={{
          container: styles.searchContainer,
          textInput: styles.textInput,
        }}
      />

      {/* Mapa con la ubicación seleccionada */}
      <MapView
        style={styles.map}
        region={selectedLocation || {
          latitude: 37.78825, // Ubicación por defecto (puedes cambiarla)
          longitude: -122.4324,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {selectedLocation && (
          <Marker coordinate={selectedLocation} title="Destino Seleccionado" />
        )}
      </MapView>

      {/* Botón para iniciar el viaje */}
      {selectedLocation && (
        <Button
          title="Iniciar Viaje"
          onPress={() => {
            // Navegar a la pantalla de viaje en tiempo real o guardar el destino
            navigation.navigate('TripInProgress', { location: selectedLocation });
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  searchContainer: {
    position: 'absolute',
    top: 10,
    width: '90%',
    alignSelf: 'center',
    zIndex: 1,
  },
  textInput: {
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  map: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});

export default RouteSelectionScreen;
