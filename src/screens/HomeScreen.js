import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, Dimensions, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const FEATURES = [
    {
        icon: 'map-outline',
        title: 'Smart Itinerary',
        desc: 'Collaborate on itineraries in real-time with friends.',
        color: '#10B981',
        gradient: ['#10B981', '#059669'],
    },
    {
        icon: 'wallet-outline',
        title: 'Fair Splitting',
        desc: 'Track expenses and settle debts without the awkwardness.',
        color: '#3B82F6',
        gradient: ['#3B82F6', '#2563EB'],
    },
    {
        icon: 'leaf-outline',
        title: 'Eco Insights',
        desc: 'See the carbon impact of your travel choices and get rewards.',
        color: '#F59E0B',
        gradient: ['#F59E0B', '#D97706'],
    },
];

const STATS = [
    { value: '10K+', label: 'Active Travelers' },
    { value: '500+', label: 'Eco Trips' },
    { value: '25T', label: 'CO₂ Saved' },
];

export default function HomeScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const cardAnimsRef = useRef(FEATURES.map(() => new Animated.Value(0)));
    const cardAnims = cardAnimsRef.current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]).start();

        cardAnims.forEach((anim, i) => {
            Animated.timing(anim, {
                toValue: 1,
                duration: 600,
                delay: 400 + i * 150,
                useNativeDriver: true,
            }).start();
        });
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Hero Section */}
                <LinearGradient colors={['#0F172A', '#1a2942', '#0F172A']} style={[styles.heroSection, { paddingTop: insets.top + 20 }]}>
                    <View style={styles.heroGlowOrb} />
                    <View style={styles.heroGlowOrb2} />

                    <Animated.View style={[styles.heroContent, {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
                    }]}>
                        <View style={styles.badge}>
                            <Ionicons name="leaf" size={14} color={COLORS.primary} />
                            <Text style={styles.badgeText}>Sustainable Travel</Text>
                        </View>

                        <Text style={styles.heroTitle}>
                            Travel the World,{'\n'}
                            <Text style={styles.heroTitleAccent}>Leave No Trace.</Text>
                        </Text>

                        <Text style={styles.heroSubtitle}>
                            Plan collaborative trips, split expenses fairly, and track your carbon footprint.
                        </Text>

                        <View style={styles.heroCTA}>
                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={() => navigation.navigate('Login')}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.primaryBtnGradient}
                                >
                                    <Text style={styles.primaryBtnText}>Get Started</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryBtn}
                                onPress={() => navigation.navigate('About')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.secondaryBtnText}>Learn More</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        {STATS.map((stat, i) => (
                            <View key={i} style={styles.statItem}>
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>
                </LinearGradient>

                {/* Features Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>WHY VOYAGO</Text>
                    <Text style={styles.sectionTitle}>Everything you need for{'\n'}eco-friendly travels</Text>

                    {FEATURES.map((feature, i) => (
                        <Animated.View
                            key={i}
                            style={[styles.featureCard, {
                                opacity: cardAnims[i],
                                transform: [{
                                    translateY: cardAnims[i].interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [30, 0],
                                    }),
                                }],
                            }]}
                        >
                            <LinearGradient
                                colors={['rgba(30,41,59,0.95)', 'rgba(15,23,42,0.98)']}
                                style={styles.featureCardGradient}
                            >
                                <View style={[styles.featureIconBox, { backgroundColor: `${feature.color}20` }]}>
                                    <Ionicons name={feature.icon} size={28} color={feature.color} />
                                </View>
                                <View style={styles.featureTextBox}>
                                    <Text style={styles.featureTitle}>{feature.title}</Text>
                                    <Text style={styles.featureDesc}>{feature.desc}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                            </LinearGradient>
                        </Animated.View>
                    ))}
                </View>

                {/* CTA Section */}
                <View style={styles.ctaSection}>
                    <LinearGradient
                        colors={['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.05)']}
                        style={styles.ctaCard}
                    >
                        <Text style={styles.ctaEmoji}>🌍</Text>
                        <Text style={styles.ctaTitle}>Join the Movement</Text>
                        <Text style={styles.ctaDesc}>
                            Start planning your next eco-friendly adventure and be part of a community that cares.
                        </Text>
                        <TouchableOpacity
                            style={styles.ctaButton}
                            onPress={() => navigation.navigate('Login')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#10B981', '#059669']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.ctaButtonGradient}
                            >
                                <Text style={styles.ctaButtonText}>Start Your Journey</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerLogo}>
                        <Text style={{ fontSize: 24 }}>🌿</Text>
                        <Text style={styles.footerLogoText}>Voyago</Text>
                    </View>
                    <Text style={styles.footerDesc}>
                        Making global travel sustainable and collaborative for everyone.
                    </Text>
                    <View style={styles.footerLinks}>
                        <TouchableOpacity onPress={() => navigation.navigate('About')}>
                            <Text style={styles.footerLink}>About</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Contact')}>
                            <Text style={styles.footerLink}>Contact</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.footerCopyright}>
                        © 2026 Voyago. All rights reserved.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    heroSection: {
        paddingTop: 20,
        paddingBottom: 40,
        paddingHorizontal: 24,
        overflow: 'hidden',
        position: 'relative',
    },
    heroGlowOrb: {
        position: 'absolute',
        top: -60,
        right: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    heroGlowOrb2: {
        position: 'absolute',
        bottom: 20,
        left: -80,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(59, 130, 246, 0.06)',
    },
    heroContent: {
        alignItems: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: SIZES.radiusFull,
        gap: 6,
        marginBottom: 20,
    },
    badgeText: {
        color: COLORS.primary,
        fontSize: SIZES.fontSm,
        fontWeight: '600',
    },
    heroTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: COLORS.text,
        textAlign: 'center',
        lineHeight: 42,
        marginBottom: 16,
    },
    heroTitleAccent: {
        color: COLORS.primary,
    },
    heroSubtitle: {
        fontSize: SIZES.fontLg,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 10,
    },
    heroCTA: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    primaryBtn: {
        borderRadius: SIZES.radiusMd,
        ...SHADOWS.glow,
    },
    primaryBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: SIZES.radiusMd,
    },
    primaryBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: SIZES.fontLg,
    },
    secondaryBtn: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: SIZES.radiusMd,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    secondaryBtnText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
        fontSize: SIZES.fontLg,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 40,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: SIZES.fontSm,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    section: {
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    sectionLabel: {
        fontSize: SIZES.fontXs,
        fontWeight: '700',
        color: COLORS.primary,
        letterSpacing: 2,
        textAlign: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: SIZES.fontXxl,
        fontWeight: '800',
        color: COLORS.text,
        textAlign: 'center',
        lineHeight: 32,
        marginBottom: 28,
    },
    featureCard: {
        marginBottom: 14,
        borderRadius: SIZES.radiusLg,
        ...SHADOWS.medium,
    },
    featureCardGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: SIZES.radiusLg,
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    featureIconBox: {
        width: 52,
        height: 52,
        borderRadius: SIZES.radiusMd,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    featureTextBox: {
        flex: 1,
    },
    featureTitle: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: SIZES.fontMd,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    ctaSection: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    ctaCard: {
        borderRadius: SIZES.radiusXl,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.15)',
    },
    ctaEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    ctaTitle: {
        fontSize: SIZES.fontXxl,
        fontWeight: '800',
        color: COLORS.text,
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
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        alignItems: 'center',
        paddingBottom: 40,
    },
    footerLogo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    footerLogoText: {
        fontSize: SIZES.fontXl,
        fontWeight: '800',
        color: COLORS.primary,
    },
    footerDesc: {
        fontSize: SIZES.fontSm,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginBottom: 16,
    },
    footerLinks: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 16,
    },
    footerLink: {
        fontSize: SIZES.fontMd,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    footerCopyright: {
        fontSize: SIZES.fontXs,
        color: COLORS.textMuted,
    },
});
