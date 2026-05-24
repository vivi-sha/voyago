import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Generate mock eco-hotspots around a given coordinate
const generateHotspots = (lat, lng) => {
    return [
        { id: 1, title: 'ChargePoint EV Station', type: 'ev', lat: lat + 0.005, lng: lng + 0.002, icon: 'battery-charging', color: '#3B82F6', desc: 'Level 2 Fast Charging' },
        { id: 2, title: 'Lime Bike Share', type: 'bike', lat: lat - 0.003, lng: lng + 0.004, icon: 'bicycle', color: '#10B981', desc: '12 Bikes Available' },
        { id: 3, title: 'The Green Fork', type: 'food', lat: lat + 0.002, lng: lng - 0.006, icon: 'restaurant', color: '#F59E0B', desc: 'Organic Vegan Cafe' },
        { id: 4, title: 'Central Nature Reserve', type: 'park', lat: lat - 0.007, lng: lng - 0.003, icon: 'leaf', color: '#059669', desc: 'Protected Urban Forest' },
    ];
};

// Map styling for dark mode
const mapCustomStyle = [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
    { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
    { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
];

export default function EcoMap({ destination }) {
    const [region, setRegion] = useState(null);
    const [hotspots, setHotspots] = useState([]);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        if (destination) {
            geocodeDestination();
        }
    }, [destination]);

    const geocodeDestination = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            const geocoded = await Location.geocodeAsync(destination);
            if (geocoded.length > 0) {
                const { latitude, longitude } = geocoded[0];
                setRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.04,
                    longitudeDelta: 0.04,
                });
                setHotspots(generateHotspots(latitude, longitude));
            } else {
                setErrorMsg('Destination could not be located on the map.');
            }
        } catch (e) {
            setErrorMsg('Error loading map data.');
        }
    };

    if (errorMsg) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="map-outline" size={32} color={COLORS.textMuted} />
                <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
        );
    }

    if (!region) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Locating destination...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.mapWrapper}>
                <MapView
                    style={styles.map}
                    initialRegion={region}
                    customMapStyle={mapCustomStyle}
                    provider={PROVIDER_GOOGLE}
                >
                    {/* Main Destination Marker */}
                    <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }}>
                        <View style={styles.mainMarker}>
                            <Ionicons name="pin" size={24} color="#EF4444" />
                        </View>
                        <Callout tooltip>
                            <View style={styles.calloutBox}>
                                <Text style={styles.calloutTitle}>{destination}</Text>
                                <Text style={styles.calloutDesc}>Your Trip Destination</Text>
                            </View>
                        </Callout>
                    </Marker>

                    {/* Eco-Hotspots */}
                    {hotspots.map(spot => (
                        <Marker
                            key={spot.id}
                            coordinate={{ latitude: spot.lat, longitude: spot.lng }}
                        >
                            <View style={[styles.spotMarker, { backgroundColor: spot.color }]}>
                                <Ionicons name={spot.icon} size={14} color="#fff" />
                            </View>
                            <Callout tooltip>
                                <View style={styles.calloutBox}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                        <Ionicons name={spot.icon} size={14} color={spot.color} />
                                        <Text style={styles.calloutTitle}>{spot.title}</Text>
                                    </View>
                                    <Text style={styles.calloutDesc}>{spot.desc}</Text>
                                </View>
                            </Callout>
                        </Marker>
                    ))}
                </MapView>
            </View>

            {/* Carbon Calculator */}
            <View style={styles.calculatorCard}>
                <Text style={styles.calcTitle}>Carbon Comparison</Text>
                <Text style={styles.calcDesc}>Estimated 50km local travel around {destination}</Text>
                
                <View style={styles.calcRow}>
                    <Text style={styles.calcIcon}>🚗</Text>
                    <View style={styles.calcBarBg}>
                        <LinearGradient colors={['#EF4444', '#B91C1C']} style={[styles.calcBarFill, { width: '80%' }]} />
                    </View>
                    <Text style={styles.calcValue}>12.5 kg</Text>
                </View>

                <View style={styles.calcRow}>
                    <Text style={styles.calcIcon}>🚆</Text>
                    <View style={styles.calcBarBg}>
                        <LinearGradient colors={['#10B981', '#059669']} style={[styles.calcBarFill, { width: '20%' }]} />
                    </View>
                    <Text style={[styles.calcValue, { color: COLORS.primary }]}>2.1 kg</Text>
                </View>
                <Text style={styles.calcSave}>Take public transit to save 10.4 kg of CO₂! 🌱</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
    },
    loadingContainer: {
        height: 200,
        backgroundColor: COLORS.backgroundCard,
        borderRadius: SIZES.radiusLg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    loadingText: {
        color: COLORS.textMuted,
        marginTop: 8,
        fontSize: SIZES.fontSm,
    },
    errorContainer: {
        height: 150,
        backgroundColor: COLORS.backgroundCard,
        borderRadius: SIZES.radiusLg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
        padding: 20,
    },
    errorText: {
        color: COLORS.textMuted,
        marginTop: 8,
        textAlign: 'center',
        fontSize: SIZES.fontSm,
    },
    mapWrapper: {
        height: 220,
        borderRadius: SIZES.radiusLg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
        marginBottom: 16,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mainMarker: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    spotMarker: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        ...SHADOWS.small,
    },
    calloutBox: {
        backgroundColor: COLORS.backgroundCard,
        borderRadius: SIZES.radiusMd,
        padding: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        minWidth: 120,
    },
    calloutTitle: {
        color: COLORS.text,
        fontWeight: '700',
        fontSize: SIZES.fontSm,
    },
    calloutDesc: {
        color: COLORS.textSecondary,
        fontSize: SIZES.fontXs,
    },
    calculatorCard: {
        backgroundColor: 'rgba(16,185,129,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.2)',
        borderRadius: SIZES.radiusMd,
        padding: 16,
    },
    calcTitle: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    calcDesc: {
        fontSize: SIZES.fontXs,
        color: COLORS.textSecondary,
        marginBottom: 16,
    },
    calcRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    calcIcon: {
        fontSize: 20,
        width: 24,
    },
    calcBarBg: {
        flex: 1,
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    calcBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    calcValue: {
        width: 45,
        fontSize: SIZES.fontSm,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'right',
    },
    calcSave: {
        fontSize: SIZES.fontSm,
        color: COLORS.primary,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 8,
    }
});
