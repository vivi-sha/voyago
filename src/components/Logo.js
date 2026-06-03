import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export default function Logo({ size = 'large' }) {
    // Widths for different sizes
    const width = size === 'small' ? 60 : size === 'medium' ? 120 : 180;
    // The original aspect ratio from the PDF is roughly width:height.
    // The dimensions of the full rendered PNG are 2974 x 4209, aspect ratio = 0.706
    const height = width / 0.706;

    return (
        <View style={[styles.container, { width, height }]}>
            <Image 
                source={require('../../assets/logo_full.png')} 
                style={styles.image}
                resizeMode="contain"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    }
});
