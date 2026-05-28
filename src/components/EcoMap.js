import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

export default function EcoMap({ destination }) {
    if (!destination) return null;

    return (
        <View style={styles.container}>
            {/* View on Google Maps Button */}
            <TouchableOpacity 
                style={styles.googleMapsBtn}
                onPress={() => {
                    const url = `https://www.google.com/maps/search/?api=1&query=tourist+attractions+in+${encodeURIComponent(destination)}`;
                    Linking.openURL(url);
                }}
            >
                <Ionicons name="map" size={20} color="#fff" />
                <Text style={styles.googleMapsBtnText}>Search Attractions on Google Maps</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
    },
    googleMapsBtn: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: SIZES.radiusLg,
        gap: 8,
        ...SHADOWS.small,
    },
    googleMapsBtnText: {
        color: '#fff',
        fontSize: SIZES.fontMd,
        fontWeight: '600',
    }
});
