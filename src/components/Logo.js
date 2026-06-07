import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function Logo({ size = 'large' }) {
    // scale factors for different sizes
    const scale = size === 'small' ? 0.6 : size === 'medium' ? 0.8 : 1;
    
    return (
        <View style={[styles.container, { transform: [{ scale }] }]}>
            <View style={styles.iconContainer}>
                <Ionicons name="location" size={72} color={COLORS.primary || '#10B981'} />
            </View>
            
            <View style={styles.textContainer}>
                <Text style={styles.textGreen}>vo</Text>
                <Text style={styles.textWhite}>yago</Text>
            </View>
            <Text style={styles.tagline}>share the journey</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111827', // Dark blue/slate background matching the image
        paddingVertical: 32,
        paddingHorizontal: 24,
        borderRadius: 36,
        width: 160,
        height: 220,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    iconContainer: {
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    leafOverlay: {
        position: 'absolute',
        top: 14, // Positioned inside the top round part of the pin
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    textGreen: {
        color: '#10B981', // Matching green
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    textWhite: {
        color: '#FFFFFF',
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    tagline: {
        color: '#94A3B8', // Slate grey
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
        letterSpacing: 0.5,
    }
});
