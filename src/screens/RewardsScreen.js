import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, Dimensions, Alert
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
        name: 'Plant 1 Tree',
        desc: 'Voyago donates $1 to One Tree Planted to plant a tree in a developing region.',
        points: 150,
        color: '#10B981',
        icon: 'leaf',
        explanation: "By spending 150 points, Voyago takes $1 of the affiliate revenue generated from your app usage and donates it to One Tree Planted, an API-integrated nonprofit that plants a tree for exactly $1."
    },
    {
        name: 'Ocean Cleanup',
        desc: 'Voyago donates $2 to extract 1kg of plastic from the ocean.',
        points: 300,
        color: '#3B82F6',
        icon: 'water',
        explanation: "By spending 300 points, Voyago donates $2 from its affiliate revenue to organizations like The Ocean Trust. It costs approximately $2 to remove 1kg of plastic from the ocean."
    },
    {
        name: 'Protect 1 Acre of Rainforest',
        desc: 'Voyago donates $3 to Rainforest Trust to protect 1 acre of land.',
        points: 450,
        color: '#F59E0B',
        icon: 'earth',
        explanation: "By spending 450 points, Voyago donates $3 to the Rainforest Trust. Because of their scale, it only costs around $3 on average to legally protect one acre of vulnerable rainforest."
    },
];

const PASSES = [
    {
        name: '5% Transit Cashback',
        desc: 'Get 5% cashback on public transit bookings via our partners.',
        points: 100,
        color: '#EC4899',
        explanation: "By spending 100 points, you get a 5% cashback link. This works because Voyago receives an 8% commission from our public transit affiliates, and we pass 5% back to you!"
    },
    {
        name: 'Eco-Hotel Discount',
        desc: 'Unlock a $10 discount code for certified green stays.',
        points: 250,
        color: '#8B5CF6',
        explanation: "By spending 250 points, you get a $10 discount code. Voyago partners with sustainable hotel networks that provide us with bulk discount codes in exchange for referring eco-conscious travelers like you."
    },
];

export default function RewardsScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { user, refreshUser, API_URL, fetchWithAuth } = useAuth();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const ecoPoints = user?.ecoPoints || 0;

    const processRedemption = async (item, isDonation) => {
        try {
            const userId = user?._id || user?.id;
            const res = await fetchWithAuth(`${API_URL}/users/${userId}/redeem`, {
                method: 'POST',
                body: JSON.stringify({ points: item.points, isDonation })
            });
            
            if (res.ok) {
                await refreshUser();
                triggerCelebration();
                playEcoChime();
                Alert.alert('Reward Redeemed! 🎉', item.explanation, [{ text: 'Awesome!' }]);
            } else {
                const errorData = await res.json();
                Alert.alert('Error', errorData.message || 'Failed to redeem points.');
            }
        } catch (e) {
            Alert.alert('Error', 'An error occurred while redeeming points.');
        }
    };

    const handleRedeem = (item, isDonation) => {
        if (ecoPoints >= item.points) {
            Alert.alert(
                'Confirm Redemption',
                `Are you sure you want to spend ${item.points} points on "${item.name}"?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm', onPress: () => processRedemption(item, isDonation) }
                ]
            );
        } else {
            Alert.alert('Keep going!', `You need ${item.points - ecoPoints} more points to unlock this.`);
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
                                            onPress={() => handleRedeem(ngo, true)}
                                        >
                                            <Text style={styles.redeemBtnText}>Redeem</Text>
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
                                    <TouchableOpacity 
                                        style={[styles.passBtn, { backgroundColor: ecoPoints >= pass.points ? pass.color : COLORS.border }]}
                                        onPress={() => handleRedeem(pass, false)}
                                    >
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
