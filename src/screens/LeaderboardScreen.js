import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Animated, Image, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerCelebration } from '../utils/feedback';

export default function LeaderboardScreen() {
    const insets = useSafeAreaInsets();
    const { user, API_URL, fetchWithAuth } = useAuth();
    const userId = user?._id || user?.id;
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchLeaderboard();
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const res = await fetchWithAuth(`${API_URL}/users`);
            if (res.ok) {
                const data = await res.json();
                const sorted = data
                    .sort((a, b) => (b.ecoPoints || 0) - (a.ecoPoints || 0))
                    .slice(0, 20);
                setLeaders(sorted);
                
                // Trigger celebration if current user is in top 3
                const userIndex = sorted.findIndex(l => String(l._id || l.id) === String(userId));
                if (userIndex >= 0 && userIndex <= 2) {
                    triggerCelebration();
                }
            }
        } catch (e) {
            console.error('Failed to fetch leaderboard:', e);
        } finally {
            setLoading(false);
        }
    };

    const getMedal = (rank) => {
        switch (rank) {
            case 0: return '🥇';
            case 1: return '🥈';
            case 2: return '🥉';
            default: return null;
        }
    };

    const getGradient = (rank) => {
        switch (rank) {
            case 0: return ['#F59E0B', '#D97706'];
            case 1: return ['#94A3B8', '#64748B'];
            case 2: return ['#CD7F32', '#A0522D'];
            default: return ['#334155', '#1E293B'];
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <LinearGradient colors={['#0F172A', '#1a2942']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
                    <Text style={styles.headerTitle}>Eco Champions 🏆</Text>
                    <Text style={styles.headerSubtitle}>See who is leading the sustainable movement</Text>
                </LinearGradient>

                {loading ? (
                    <View style={{ paddingTop: 60, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                <>

                {/* Top 3 Podium */}
                {leaders.length >= 3 && (
                    <View style={styles.podium}>
                        {[1, 0, 2].map((rank) => {
                            const leader = leaders[rank];
                            if (!leader) return null;
                            return (
                                <View key={rank} style={[styles.podiumItem, rank === 0 && styles.podiumFirst]}>
                                    <View style={[styles.podiumAvatar, rank === 0 && styles.podiumAvatarFirst]}>
                                        {leader.photoUrl ? (
                                            <Image source={{ uri: leader.photoUrl }} style={styles.podiumImg} />
                                        ) : (
                                            <LinearGradient
                                                colors={getGradient(rank)}
                                                style={styles.podiumPlaceholder}
                                            >
                                                <Text style={styles.podiumAvatarText}>
                                                    {leader.name?.charAt(0)?.toUpperCase() || '?'}
                                                </Text>
                                            </LinearGradient>
                                        )}
                                        <View style={styles.medalBadge}>
                                            <Text style={{ fontSize: 16 }}>{getMedal(rank)}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.podiumName} numberOfLines={1}>
                                        {String(leader._id || leader.id) === String(userId) ? 'You' : leader.name}
                                    </Text>
                                    <View style={styles.podiumPoints}>
                                        <Ionicons name="leaf" size={12} color={COLORS.primary} />
                                        <Text style={styles.podiumPointsText}>{leader.ecoPoints || 0}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Full Rankings */}
                <Animated.View style={[styles.rankingsSection, { opacity: fadeAnim }]}>
                    <Text style={styles.sectionTitle}>All Rankings</Text>
                    {leaders.map((leader, i) => (
                        <View
                            key={leader._id || leader.id || i}
                            style={[
                                styles.rankCard,
                                String(leader._id || leader.id) === String(userId) && styles.rankCardHighlight
                            ]}
                        >
                            <Text style={[styles.rankNumber, i < 3 && { color: getGradient(i)[0] }]}>
                                #{i + 1}
                            </Text>

                            {leader.photoUrl ? (
                                <Image source={{ uri: leader.photoUrl }} style={styles.rankAvatar} />
                            ) : (
                                <LinearGradient
                                    colors={getGradient(i)}
                                    style={styles.rankAvatarPlaceholder}
                                >
                                    <Text style={styles.rankAvatarText}>
                                        {leader.name?.charAt(0)?.toUpperCase() || '?'}
                                    </Text>
                                </LinearGradient>
                            )}

                            <View style={styles.rankInfo}>
                                <Text style={styles.rankName}>
                                    {String(leader._id || leader.id) === String(userId) ? `${leader.name} (You)` : leader.name}
                                </Text>
                                <Text style={styles.rankEmail}>{leader.email}</Text>
                            </View>

                            <View style={styles.rankPointsBadge}>
                                <Ionicons name="leaf" size={14} color={COLORS.primary} />
                                <Text style={styles.rankPointsText}>{leader.ecoPoints || 0}</Text>
                            </View>
                        </View>
                    ))}
                </Animated.View>
                </>
                )}

                <View style={{ height: 100 }} />
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
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: SIZES.fontXxl,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: SIZES.fontMd,
        color: COLORS.textSecondary,
    },
    podium: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 24,
        gap: 16,
    },
    podiumItem: {
        alignItems: 'center',
        flex: 1,
    },
    podiumFirst: {
        marginBottom: 16,
    },
    podiumAvatar: {
        position: 'relative',
        marginBottom: 8,
    },
    podiumAvatarFirst: {
        transform: [{ scale: 1.15 }],
    },
    podiumImg: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    podiumPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    podiumAvatarText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 22,
    },
    medalBadge: {
        position: 'absolute',
        bottom: -6,
        right: -6,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 2,
    },
    podiumName: {
        fontSize: SIZES.fontSm,
        fontWeight: '600',
        color: COLORS.text,
        maxWidth: 80,
        textAlign: 'center',
    },
    podiumPoints: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    podiumPointsText: {
        fontSize: SIZES.fontXs,
        fontWeight: '700',
        color: COLORS.primary,
    },
    rankingsSection: {
        paddingHorizontal: 20,
        paddingTop: 28,
    },
    sectionTitle: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    rankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundCard,
        borderRadius: SIZES.radiusMd,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    rankCardHighlight: {
        borderColor: 'rgba(16,185,129,0.3)',
        backgroundColor: 'rgba(16,185,129,0.05)',
    },
    rankNumber: {
        fontSize: SIZES.fontLg,
        fontWeight: '800',
        color: COLORS.textMuted,
        width: 36,
    },
    rankAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    rankAvatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rankAvatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    rankInfo: {
        flex: 1,
    },
    rankName: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    rankEmail: {
        fontSize: SIZES.fontXs,
        color: COLORS.textMuted,
    },
    rankPointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(16,185,129,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: SIZES.radiusFull,
    },
    rankPointsText: {
        fontSize: SIZES.fontSm,
        fontWeight: '700',
        color: COLORS.primary,
    },
});
