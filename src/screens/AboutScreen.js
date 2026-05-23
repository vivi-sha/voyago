import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AboutScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <LinearGradient colors={['#0F172A', '#1a2942']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>About Voyago</Text>
                    <Text style={styles.headerSubtitle}>
                        Empowering conscious travelers to explore the world while minimizing their carbon footprint.
                    </Text>
                </LinearGradient>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Our Mission 🎯</Text>
                    <View style={styles.missionCard}>
                        <Text style={styles.missionText}>
                            At Voyago, we believe that travel is one of the most enriching experiences a human can have. However, we also recognize the environmental impact that global travel has on our planet.
                        </Text>
                        <Text style={[styles.missionText, { marginTop: 12 }]}>
                            Our mission is to provide travelers with the tools they need to plan, track, and offset their travel-related emissions, all while making group travel and expense sharing seamless and fair.
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.featureCard}>
                        <View style={[styles.featureIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                            <Text style={{ fontSize: 28 }}>🌍</Text>
                        </View>
                        <Text style={styles.featureTitle}>Sustainable Travel</Text>
                        <Text style={styles.featureDesc}>
                            We provide real-time carbon footprint calculations for your trips, helping you make greener choices.
                        </Text>
                    </View>

                    <View style={styles.featureCard}>
                        <View style={[styles.featureIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                            <Text style={{ fontSize: 28 }}>🤝</Text>
                        </View>
                        <Text style={styles.featureTitle}>Group Harmony</Text>
                        <Text style={styles.featureDesc}>
                            Our integrated expense splitting ensures that finances never get in the way of a great adventure.
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.ctaCard}>
                        <LinearGradient
                            colors={['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.05)']}
                            style={styles.ctaGradient}
                        >
                            <Text style={{ fontSize: 40 }}>🌱</Text>
                            <Text style={styles.ctaTitle}>Join the Movement</Text>
                            <Text style={styles.ctaDesc}>
                                Start planning your next eco-friendly adventure today and be part of a community that cares.
                            </Text>
                            {!user && (
                                <TouchableOpacity
                                    style={styles.ctaButton}
                                    onPress={() => navigation.navigate('Login')}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#10B981', '#059669']}
                                        style={styles.ctaButtonGradient}
                                    >
                                        <Text style={styles.ctaButtonText}>Get Started</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </LinearGradient>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingTop: 16,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 12,
    },
    headerSubtitle: {
        fontSize: SIZES.fontMd,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    section: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    sectionTitle: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    missionCard: {
        backgroundColor: COLORS.backgroundCard,
        borderRadius: SIZES.radiusLg,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    missionText: {
        fontSize: SIZES.fontMd,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    featureCard: {
        backgroundColor: COLORS.backgroundCard,
        borderRadius: SIZES.radiusLg,
        padding: 24,
        marginBottom: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    featureIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    featureTitle: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
    },
    featureDesc: {
        fontSize: SIZES.fontMd,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    ctaCard: {
        borderRadius: SIZES.radiusXl,
        overflow: 'hidden',
    },
    ctaGradient: {
        padding: 32,
        alignItems: 'center',
        borderRadius: SIZES.radiusXl,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.15)',
    },
    ctaTitle: {
        fontSize: SIZES.fontXxl,
        fontWeight: '800',
        color: COLORS.text,
        marginTop: 12,
        marginBottom: 12,
    },
    ctaDesc: {
        fontSize: SIZES.fontMd,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    ctaButton: {
        borderRadius: SIZES.radiusMd,
    },
    ctaButtonGradient: {
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: SIZES.radiusMd,
    },
    ctaButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: SIZES.fontLg,
    },
});
