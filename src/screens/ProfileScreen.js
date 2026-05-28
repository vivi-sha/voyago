import React, { useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerCelebration } from '../utils/feedback';
import DailyChallengeCard from '../components/DailyChallengeCard';

export default function ProfileScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { user, clerkUser, logout, refreshUser } = useAuth();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const profileName = user?.name || clerkUser?.fullName || clerkUser?.firstName || 'Traveler';
    const profileEmail = user?.email || clerkUser?.primaryEmailAddress?.emailAddress || '';
    const profilePhoto = user?.photoUrl || clerkUser?.imageUrl;

    useFocusEffect(
        useCallback(() => {
            refreshUser();
        }, [refreshUser])
    );

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const ecoPoints = user?.ecoPoints || 0;
    const donatedPoints = user?.donatedPoints || 0;
    const goalPoints = 500;
    const progress = Math.min(ecoPoints / goalPoints, 1);
    
    const goalReachedRef = useRef(false);

    useEffect(() => {
        if (ecoPoints >= goalPoints && !goalReachedRef.current) {
            triggerCelebration();
            goalReachedRef.current = true;
        } else if (ecoPoints < goalPoints) {
            goalReachedRef.current = false;
        }
    }, [ecoPoints]);

    const handleLogout = () => {
        logout();
    };

    const menuItems = [
        { icon: 'map-outline', label: 'My Trips', screen: 'TripsTab', color: '#3B82F6' },
        { icon: 'leaf-outline', label: 'Eco Impact', screen: 'ImpactTab', color: '#10B981' },
        { icon: 'trophy-outline', label: 'Leaderboard', screen: 'LeaderboardTab', color: '#F59E0B' },
        { icon: 'gift-outline', label: 'Rewards', screen: 'Rewards', color: '#EC4899' },
    ];

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Profile Header */}
                <LinearGradient colors={['#0F172A', '#1a2942']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
                    <View style={styles.headerTop}>
                        <Text style={styles.headerTitle}>Profile</Text>
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                            <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
                        </TouchableOpacity>
                    </View>

                    <Animated.View style={[styles.profileCard, { opacity: fadeAnim }]}>
                        <View style={styles.avatarSection}>
                            {profilePhoto ? (
                                <Image source={{ uri: profilePhoto }} style={styles.avatar} />
                            ) : (
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    style={styles.avatarPlaceholder}
                                >
                                    <Text style={styles.avatarText}>
                                        {profileName?.charAt(0)?.toUpperCase() || '?'}
                                    </Text>
                                </LinearGradient>
                            )}
                            <View style={styles.onlineDot} />
                        </View>
                        <Text style={styles.userName}>{profileName}</Text>
                        <Text style={styles.userEmail}>{profileEmail}</Text>

                        {/* Eco Points Badge */}
                        <View style={styles.pointsBadge}>
                            <Ionicons name="leaf" size={16} color={COLORS.primary} />
                            <Text style={styles.pointsText}>{ecoPoints} Eco Points</Text>
                        </View>
                    </Animated.View>
                </LinearGradient>

                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <LinearGradient
                            colors={['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.05)']}
                            style={styles.statGradient}
                        >
                            <Text style={styles.statEmoji}>🌱</Text>
                            <Text style={styles.statValue}>{ecoPoints}</Text>
                            <Text style={styles.statLabel}>Eco Points</Text>
                        </LinearGradient>
                    </View>
                    <View style={styles.statCard}>
                        <LinearGradient
                            colors={['rgba(236,72,153,0.15)', 'rgba(236,72,153,0.05)']}
                            style={styles.statGradient}
                        >
                            <Text style={styles.statEmoji}>💝</Text>
                            <Text style={styles.statValue}>{donatedPoints}</Text>
                            <Text style={styles.statLabel}>Donated</Text>
                        </LinearGradient>
                    </View>
                </View>

                {/* Daily Challenge Card */}
                <DailyChallengeCard user={user} refreshUser={refreshUser} />

                {/* Earth Impact */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Earth Impact 🌍</Text>
                    <View style={styles.impactCard}>
                        <Text style={styles.impactText}>You're making a difference!</Text>

                        {/* Goal Progress */}
                        <View style={styles.goalSection}>
                            <View style={styles.goalHeader}>
                                <Text style={styles.goalTitle}>🎯 Next Goal</Text>
                                <Text style={styles.goalProgress}>{ecoPoints}/{goalPoints}</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
                                />
                            </View>
                            <Text style={styles.goalDesc}>
                                {ecoPoints >= goalPoints
                                    ? '🏆 Goal achieved! Badge earned.'
                                    : `${Math.max(0, goalPoints - ecoPoints)} more points to unlock!`}
                            </Text>
                            <Text style={styles.goalPromo}>
                                Gold Supporters get a chance to win a free volunteered trip or hike!
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.menuGrid}>
                        {menuItems.map((item, i) => (
                            <TouchableOpacity
                                key={i}
                                style={styles.menuItem}
                                onPress={() => {
                                    if (item.screen === 'Rewards') {
                                        navigation.navigate('Rewards');
                                    } else {
                                        navigation.navigate(item.screen);
                                    }
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                                    <Ionicons name={item.icon} size={24} color={item.color} />
                                </View>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
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
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: SIZES.fontXxl,
        fontWeight: '800',
        color: COLORS.text,
    },
    logoutBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(239,68,68,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileCard: {
        alignItems: 'center',
    },
    avatarSection: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    avatarPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        borderWidth: 3,
        borderColor: COLORS.background,
    },
    userName: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: SIZES.fontMd,
        color: COLORS.textSecondary,
        marginBottom: 16,
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: SIZES.radiusFull,
    },
    pointsText: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.primary,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginTop: -10,
    },
    statCard: {
        flex: 1,
        borderRadius: SIZES.radiusLg,
        overflow: 'hidden',
        ...SHADOWS.small,
    },
    statGradient: {
        padding: 18,
        alignItems: 'center',
        borderRadius: SIZES.radiusLg,
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    statEmoji: {
        fontSize: 24,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
    },
    statLabel: {
        fontSize: SIZES.fontSm,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    section: {
        paddingHorizontal: 20,
        paddingTop: 28,
    },
    sectionTitle: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    impactCard: {
        backgroundColor: COLORS.backgroundCard,
        borderRadius: SIZES.radiusLg,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    impactText: {
        fontSize: SIZES.fontMd,
        color: COLORS.textSecondary,
        marginBottom: 16,
    },
    goalSection: {
        backgroundColor: 'rgba(16,185,129,0.05)',
        borderRadius: SIZES.radiusMd,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.1)',
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    goalTitle: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.text,
    },
    goalProgress: {
        fontSize: SIZES.fontSm,
        fontWeight: '600',
        color: COLORS.primary,
    },
    progressBarBg: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 4,
        marginBottom: 12,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    goalDesc: {
        fontSize: SIZES.fontSm,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    goalPromo: {
        fontSize: SIZES.fontXs,
        color: COLORS.textMuted,
        fontStyle: 'italic',
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    menuItem: {
        width: '47%',
        backgroundColor: COLORS.backgroundCard,
        borderRadius: SIZES.radiusLg,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    menuIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    menuLabel: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.text,
    },
});
