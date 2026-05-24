import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Animated, ActivityIndicator, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth, API_URL } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ImpactScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { user, refreshUser, API_URL, fetchWithAuth } = useAuth();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const ecoPoints = user?.ecoPoints || 0;
    const treesCount = Math.floor(ecoPoints / 100);
    
    // Create up to 100 animated values for our trees to spring in
    const treeAnims = useRef([...Array(100)].map(() => new Animated.Value(0))).current;

    useEffect(() => {
        refreshUser();
        fetchActivities();
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    // Animate trees whenever the count changes
    useEffect(() => {
        if (treesCount > 0) {
            const animations = treeAnims.slice(0, Math.min(treesCount, 100)).map(anim =>
                Animated.spring(anim, {
                    toValue: 1,
                    friction: 5,
                    tension: 40,
                    useNativeDriver: true,
                })
            );
            Animated.stagger(100, animations).start();
        }
    }, [treesCount]);

    const fetchActivities = async () => {
        const userId = user?._id || user?.id;
        if (!userId) {
            setLoading(true);
            return;
        }
        try {
            const userId = user?._id || user?.id;
            const res = await fetchWithAuth(`${API_URL}/expenses?payerId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                const ecoActivities = data
                    .filter(e => e.isEcoFriendly)
                    .map(e => ({
                        title: e.description,
                        date: e.date,
                        points: 10,
                    }));
                setActivities(ecoActivities);
            }
        } catch (e) {
            console.error('Failed to fetch activities:', e);
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        { value: `${ecoPoints}`, label: 'Eco Points', icon: 'leaf', color: '#10B981' },
        { value: `${activities.length}`, label: 'Eco Actions', icon: 'flash', color: '#F59E0B' },
        { value: `${(ecoPoints * 0.5).toFixed(0)}kg`, label: 'CO₂ Saved', icon: 'earth', color: '#3B82F6' },
        { value: `${Math.floor(ecoPoints / 100)}`, label: 'Trees Planted', icon: 'flower', color: '#EC4899' },
    ];

    const monthlyData = [
        { month: 'Jan', value: 20 },
        { month: 'Feb', value: 35 },
        { month: 'Mar', value: 45 },
        { month: 'Apr', value: 60 },
        { month: 'May', value: 40 },
        { month: 'Jun', value: 75 },
    ];
    const maxValue = Math.max(...monthlyData.map(d => d.value), 1);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <LinearGradient colors={['#0F172A', '#1a2942']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
                    <Text style={styles.headerTitle}>Your Sustainability Impact 🌍</Text>
                    <Text style={styles.headerSubtitle}>Track your eco-friendly journey</Text>
                </LinearGradient>

                {/* Stats Grid */}
                {loading ? (
                    <View style={{ paddingTop: 60, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                <Animated.View style={[styles.statsGrid, { opacity: fadeAnim }]}>
                    {stats.map((stat, i) => (
                        <View key={i} style={styles.statCard}>
                            <LinearGradient
                                colors={[`${stat.color}15`, `${stat.color}08`]}
                                style={styles.statGradient}
                            >
                                <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                                    <Ionicons name={stat.icon} size={22} color={stat.color} />
                                </View>
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </LinearGradient>
                        </View>
                    ))}
                </Animated.View>
                )}

                {/* Dynamic Virtual Forest */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Virtual Forest 🌳</Text>
                    <View style={styles.forestContainer}>
                        {treesCount === 0 ? (
                            <View style={styles.emptyForest}>
                                <View style={styles.seedContainer}>
                                    <MaterialCommunityIcons name="seed-outline" size={40} color={COLORS.primary} />
                                </View>
                                <Text style={styles.emptyForestText}>Plant your first seed!</Text>
                                <Text style={styles.emptyForestSubtext}>Earn 100 Eco Points to grow a tree.</Text>
                            </View>
                        ) : (
                            <View style={styles.forestGrid}>
                                {[...Array(Math.min(treesCount, 100))].map((_, i) => (
                                    <Animated.View 
                                        key={i} 
                                        style={[
                                            styles.treeWrapper,
                                            { transform: [{ scale: treeAnims[i] }] }
                                        ]}
                                    >
                                        <MaterialCommunityIcons 
                                            name={i % 3 === 0 ? "pine-tree" : "tree"} 
                                            size={48} 
                                            color={COLORS.primary} 
                                        />
                                    </Animated.View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* Monthly Impact Chart */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Monthly Impact Trend 📊</Text>
                    <View style={styles.chartCard}>
                        <View style={styles.chartContainer}>
                            {monthlyData.map((d, i) => (
                                <View key={i} style={styles.chartBarGroup}>
                                    <View style={styles.chartBarBg}>
                                        <LinearGradient
                                            colors={['#10B981', '#059669']}
                                            style={[styles.chartBar, {
                                                height: `${(d.value / maxValue) * 100}%`,
                                            }]}
                                        />
                                    </View>
                                    <Text style={styles.chartLabel}>{d.month}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Recent Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Eco-Actions 🌱</Text>
                    {activities.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={{ fontSize: 40 }}>🌿</Text>
                            <Text style={styles.emptyText}>No eco-actions recorded yet.</Text>
                            <Text style={styles.emptySubtext}>Start exploring!</Text>
                        </View>
                    ) : (
                        activities.slice(0, 10).map((act, i) => (
                            <View key={i} style={styles.activityCard}>
                                <View style={styles.activityDot} />
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityDate}>{formatDate(act.date)}</Text>
                                    <Text style={styles.activityTitle}>{act.title}</Text>
                                </View>
                                <Text style={styles.activityPoints}>+{act.points} pts</Text>
                            </View>
                        ))
                    )}
                </View>

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
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 10,
        marginTop: 16,
    },
    statCard: {
        width: (width - 50) / 2,
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
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.text,
    },
    statLabel: {
        fontSize: SIZES.fontXs,
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
    forestContainer: {
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderRadius: SIZES.radiusLg,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        padding: 20,
        minHeight: 140,
        justifyContent: 'center',
    },
    emptyForest: {
        alignItems: 'center',
    },
    seedContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    emptyForestText: {
        fontSize: SIZES.fontLg,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    emptyForestSubtext: {
        fontSize: SIZES.fontSm,
        color: COLORS.textSecondary,
    },
    forestGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'flex-start',
    },
    treeWrapper: {
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chartCard: {
        backgroundColor: COLORS.backgroundCard,
        borderRadius: SIZES.radiusLg,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 140,
    },
    chartBarGroup: {
        alignItems: 'center',
        flex: 1,
    },
    chartBarBg: {
        width: 28,
        height: 120,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    chartBar: {
        width: '100%',
        borderRadius: 14,
        minHeight: 8,
    },
    chartLabel: {
        fontSize: SIZES.fontXs,
        color: COLORS.textMuted,
        marginTop: 8,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: COLORS.backgroundCard,
        borderRadius: SIZES.radiusLg,
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    emptyText: {
        fontSize: SIZES.fontMd,
        color: COLORS.textSecondary,
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: SIZES.fontSm,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundCard,
        borderRadius: SIZES.radiusMd,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    activityDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        marginRight: 12,
    },
    activityInfo: {
        flex: 1,
    },
    activityDate: {
        fontSize: SIZES.fontXs,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    activityTitle: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.text,
    },
    activityPoints: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.primary,
    },
});
