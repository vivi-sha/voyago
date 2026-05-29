import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View, Text, StyleSheet, ScrollView, Animated, ActivityIndicator, Dimensions, TouchableOpacity
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
    const [monthlyData, setMonthlyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const ecoPoints = user?.ecoPoints || 0;
    
    // Determine growth stage based on points
    let plantIcon = 'seed-outline';
    let plantColor = COLORS.primary;
    let plantSize = 60;
    let stageName = 'Seed';
    
    if (ecoPoints >= 500) {
        plantIcon = 'pine-tree';
        plantSize = 140;
        stageName = 'Mighty Pine';
    } else if (ecoPoints >= 300) {
        plantIcon = 'tree';
        plantSize = 120;
        stageName = 'Large Tree';
    } else if (ecoPoints >= 100) {
        plantIcon = 'tree-outline';
        plantSize = 100;
        stageName = 'Young Tree';
    } else if (ecoPoints >= 50) {
        plantIcon = 'flower';
        plantSize = 80;
        plantColor = '#EC4899'; // pink flower
        stageName = 'Blooming Plant';
    } else if (ecoPoints >= 10) {
        plantIcon = 'sprout';
        plantSize = 70;
        stageName = 'Sprout';
    } else if (ecoPoints >= 5) {
        plantIcon = 'seed';
        plantSize = 60;
        stageName = 'Germinating Seed';
    }

    const scaleAnim = useRef(new Animated.Value(0.5)).current;

    useFocusEffect(
        useCallback(() => {
            refreshUser();
            fetchActivities();
        }, [refreshUser, user?._id, user?.ecoPoints])
    );

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    // Animate plant whenever the icon or points change
    useEffect(() => {
        scaleAnim.setValue(0.5);
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
        }).start();
    }, [plantIcon, ecoPoints]);

    const fetchActivities = async () => {
        const userId = user?._id || user?.id;
        if (!userId) {
            setLoading(true);
            return;
        }
        try {
            // Add a cache buster to ensure it fetches fresh data in real-time
            const res = await fetchWithAuth(`${API_URL}/expenses?participantId=${userId}&t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                const ecoActivities = data
                    .filter(e => e.isEcoFriendly)
                    .map(e => ({
                        title: e.description,
                        date: e.date,
                        points: 15,
                    }));
                
                // Add dummy daily challenge if points are high just to show history (Optional)
                setActivities(ecoActivities);

                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const last6Months = [];
                const now = new Date();
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    last6Months.push({
                        month: monthNames[d.getMonth()],
                        year: d.getFullYear(),
                        value: 0
                    });
                }

                ecoActivities.forEach(act => {
                    const actDate = new Date(act.date);
                    const target = last6Months.find(m => m.month === monthNames[actDate.getMonth()] && m.year === actDate.getFullYear());
                    if (target) {
                        target.value += act.points;
                    }
                });

                setMonthlyData(last6Months);
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

    const maxValue = Math.max(...monthlyData.map(d => d.value), 100);

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
                    <Text style={styles.sectionTitle}>Your Virtual Plant 🌱</Text>
                    <View style={styles.forestContainer}>
                        <View style={styles.singlePlantContainer}>
                            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                <MaterialCommunityIcons 
                                    name={plantIcon} 
                                    size={plantSize} 
                                    color={plantColor} 
                                />
                            </Animated.View>
                            <Text style={styles.plantStageText}>Current Stage: {stageName}</Text>
                            <Text style={styles.plantPointsText}>{ecoPoints} Points</Text>
                        </View>
                    </View>
                </View>

                {/* Monthly Impact Chart */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Monthly Impact Trend 📊</Text>
                    <View style={styles.chartCard}>
                        <View style={styles.chartContainer}>
                            {monthlyData.map((d, i) => (
                                <TouchableOpacity 
                                    key={i} 
                                    style={styles.chartBarGroup}
                                    onPress={() => alert(`You earned ${d.value} Eco Points in ${d.month}.`)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.chartBarBg}>
                                        <LinearGradient
                                            colors={['#10B981', '#059669']}
                                            style={[styles.chartBar, {
                                                height: `${(d.value / maxValue) * 100}%`,
                                            }]}
                                        />
                                    </View>
                                    <Text style={styles.chartLabel}>{d.month}</Text>
                                </TouchableOpacity>
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
    singlePlantContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    plantStageText: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 16,
    },
    plantPointsText: {
        fontSize: SIZES.fontMd,
        color: COLORS.primary,
        marginTop: 4,
        fontWeight: '600',
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
