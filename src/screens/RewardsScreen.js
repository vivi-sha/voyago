import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerCelebration, playEcoChime } from '../utils/feedback';

const { width } = Dimensions.get('window');

const NGOS = [
    {
        name: 'Sankalp Taru Foundation',
        desc: 'Plant an environmental tree in your name to combat climate change.',
        points: 150,
        color: '#10B981',
        icon: 'leaf',
    },
    {
        name: 'Give India',
        desc: 'Support vulnerable communities with your points for sustainable living.',
        points: 250,
        color: '#3B82F6',
        icon: 'heart',
    },
    {
        name: 'Say Trees',
        desc: 'Help create urban forests to improve air quality in cities.',
        points: 350,
        color: '#10B981',
        icon: 'flower',
    },
];

const PASSES = [
    {
        name: 'Eco Pass Weekly',
        desc: 'Get access to eco-friendly transport discounts for a week.',
        points: 100,
        color: '#EC4899',
    },
    {
        name: 'Green Stay Badge',
        desc: 'Unlock exclusive status at eco-hotels and homestays.',
        points: 300,
        color: '#8B5CF6',
    },
    {
        name: 'Sustainable Explorer',
        desc: 'Full access to premium eco-travel guides and tools.',
        points: 500,
        color: '#F59E0B',
    },
];

export default function RewardsScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const ecoPoints = user?.ecoPoints || 0;

    const handleDonate = (ngo) => {
        if (ecoPoints >= ngo.points) {
            triggerCelebration();
            playEcoChime();
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <LinearGradient colors={['#0F172A', '#1a2942']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Explore & Redeem 🎁</Text>
                    <Text style={styles.headerSubtitle}>
                        Use your travel points to make a real-world difference or unlock perks.
                    </Text>

                    <View style={styles.pointsBadge}>
                        <View style={styles.pointsLabel}>
                            <Ionicons name="leaf" size={20} color={COLORS.primary} />
                            <Text style={styles.pointsValue}>{ecoPoints}</Text>
                            <Text style={styles.pointsUnit}>Pts Available</Text>
                        </View>
                    </View>
                </LinearGradient>

                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    {/* NGOs Section */}
                    <Text style={styles.sectionTitle}>Support NGOs 🤝</Text>
                    {NGOS.map((ngo, i) => (
                        <TouchableOpacity key={i} style={styles.rewardCard} activeOpacity={0.8}>
                            <LinearGradient
                                colors={['rgba(30,41,59,0.95)', 'rgba(15,23,42,0.98)']}
                                style={styles.cardGradient}
                            >
                                <View style={[styles.rewardIcon, { backgroundColor: `${ngo.color}15` }]}>
                                    <Ionicons name={ngo.icon} size={28} color={ngo.color} />
                                </View>
                                <View style={styles.rewardInfo}>
                                    <Text style={styles.rewardName}>{ngo.name}</Text>
                                    <Text style={styles.rewardDesc}>{ngo.desc}</Text>
                                    <View style={styles.priceRow}>
                                        <Text style={[styles.priceTag, { color: ngo.color }]}>{ngo.points} Pts</Text>
                                        <TouchableOpacity 
                                            style={[styles.redeemBtn, { backgroundColor: ecoPoints >= ngo.points ? COLORS.primary : COLORS.border }]}
                                            onPress={() => handleDonate(ngo)}
                                        >
                                            <Text style={styles.redeemBtnText}>Donate</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}

                    {/* Perks Section */}
                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Get Rewards 🎁</Text>
                    <View style={styles.passesRow}>
                        {PASSES.map((pass, i) => (
                            <TouchableOpacity key={i} style={styles.passCard} activeOpacity={0.8}>
                                <LinearGradient
                                    colors={[`${pass.color}15`, `${pass.color}08`]}
                                    style={styles.passGradient}
                                >
                                    <Text style={styles.passEmoji}>🎫</Text>
                                    <Text style={styles.passName}>{pass.name}</Text>
                                    <Text style={styles.passPoints}>{pass.points} Pts</Text>
                                    <Text style={styles.passDesc} numberOfLines={2}>{pass.desc}</Text>
                                    <TouchableOpacity style={[styles.passBtn, { backgroundColor: pass.color }]}>
                                        <Text style={styles.passBtnText}>Redeem</Text>
                                    </TouchableOpacity>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

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
        paddingBottom: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    backBtn: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 8,
        textAlign: 'center',
        marginTop: 10,
    },
    headerSubtitle: {
        fontSize: SIZES.fontMd,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    pointsBadge: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: SIZES.radiusLg,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    pointsLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    pointsValue: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.primary,
    },
    pointsUnit: {
        fontSize: SIZES.fontSm,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    sectionTitle: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    rewardCard: {
        marginBottom: 14,
        borderRadius: SIZES.radiusLg,
        ...SHADOWS.medium,
    },
    cardGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: SIZES.radiusLg,
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    rewardIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    rewardInfo: {
        flex: 1,
    },
    rewardName: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    rewardDesc: {
        fontSize: SIZES.fontSm,
        color: COLORS.textSecondary,
        lineHeight: 18,
        marginBottom: 12,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceTag: {
        fontSize: SIZES.fontMd,
        fontWeight: '800',
    },
    redeemBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: SIZES.radiusMd,
    },
    redeemBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: SIZES.fontSm,
    },
    passesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    passCard: {
        width: (width - 52) / 2,
        borderRadius: SIZES.radiusLg,
        overflow: 'hidden',
    },
    passGradient: {
        padding: 18,
        alignItems: 'center',
        borderRadius: SIZES.radiusLg,
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
        minHeight: 200,
        flexDirection: 'column',
        justifyContent: 'flex-start',
    },
    passEmoji: {
        fontSize: 28,
        marginBottom: 12,
    },
    passName: {
        fontSize: SIZES.fontMd,
        fontWeight: '800',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 4,
    },
    passPoints: {
        fontSize: SIZES.fontSm,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 8,
    },
    passDesc: {
        fontSize: SIZES.fontXs,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 16,
        marginBottom: 14,
        flexGrow: 1,
    },
    passBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: SIZES.radiusMd,
        width: '100%',
        alignItems: 'center',
    },
    passBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: SIZES.fontSm,
    },
});
