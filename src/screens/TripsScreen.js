import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, ActivityIndicator, Modal, Animated, RefreshControl,
    DeviceEventEmitter
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TripsScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { user, API_URL, fetchWithAuth } = useAuth();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [newTripName, setNewTripName] = useState('');
    const [newTripDest, setNewTripDest] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [creating, setCreating] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchTrips();
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        
        const subscription = DeviceEventEmitter.addListener('refreshTrips', () => {
            fetchTrips();
        });
        return () => subscription.remove();
    }, []);

    const fetchTrips = async () => {
        const userId = user?._id || user?.id;
        if (!userId) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetchWithAuth(`${API_URL}/trips?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setTrips(data);
            }
        } catch (e) {
            console.error('Failed to fetch trips:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const createTrip = async () => {
        if (!newTripName.trim() || !newTripDest.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setCreating(true);
        try {
            const userId = user?._id || user?.id;
            const res = await fetchWithAuth(`${API_URL}/trips`, {
                method: 'POST',
                body: JSON.stringify({
                    name: newTripName,
                    destination: newTripDest,
                    creatorId: userId,
                    members: [userId],
                }),
            });
            if (res.ok) {
                setShowCreateModal(false);
                setNewTripName('');
                setNewTripDest('');
                fetchTrips();
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to create trip');
        } finally {
            setCreating(false);
        }
    };

    const joinTrip = async () => {
        if (!joinCode.trim()) {
            Alert.alert('Error', 'Please enter a trip code');
            return;
        }
        try {
            const res = await fetchWithAuth(`${API_URL}/trips/join`, {
                method: 'POST',
                body: JSON.stringify({ shareCode: joinCode, userId: user._id || user.id }),
            });
            if (res.ok) {
                setShowJoinModal(false);
                setJoinCode('');
                fetchTrips();
                Alert.alert('Success', 'Joined trip successfully!');
            } else {
                const data = await res.json();
                Alert.alert('Error', data.error || 'Invalid code');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to join trip');
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const renderModal = (visible, setVisible, title, content) => (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={() => setVisible(false)}>
                            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    {content}
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#0F172A', '#1a2942']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <Text style={styles.headerTitle}>My Trips ✈️</Text>
                <Text style={styles.headerSubtitle}>Plan your next adventure</Text>
            </LinearGradient>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setShowCreateModal(true)}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.actionBtnGradient}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#fff" />
                        <Text style={styles.actionBtnText}>New Trip</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setShowJoinModal(true)}
                    activeOpacity={0.8}
                >
                    <View style={styles.actionBtnOutline}>
                        <Ionicons name="link-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.actionBtnOutlineText}>Join Trip</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Trips List */}
            <ScrollView
                style={styles.tripsList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchTrips(); }}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : trips.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={{ fontSize: 48 }}>🗺️</Text>
                        <Text style={styles.emptyTitle}>No trips yet</Text>
                        <Text style={styles.emptyDesc}>Create one or join a friend's trip!</Text>
                    </View>
                ) : (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        {trips.map((trip, i) => (
                            <TouchableOpacity
                                key={trip._id || trip.id || i}
                                style={styles.tripCard}
                                onPress={() => navigation.navigate('TripDetail', { trip: trip })}
                                activeOpacity={0.7}
                            >
                                <LinearGradient
                                    colors={['rgba(30,41,59,0.95)', 'rgba(15,23,42,0.98)']}
                                    style={styles.tripCardGradient}
                                >
                                    <View style={styles.tripCardHeader}>
                                        <View style={styles.tripIconBox}>
                                            <Text style={{ fontSize: 24 }}>✈️</Text>
                                        </View>
                                        <View style={styles.tripCardInfo}>
                                            <Text style={styles.tripName}>{trip.name}</Text>
                                            <View style={styles.tripMeta}>
                                                <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                                                <Text style={styles.tripDest}>{trip.destination}</Text>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                                    </View>

                                    <View style={styles.tripCardFooter}>
                                        <View style={styles.tripStat}>
                                            <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
                                            <Text style={styles.tripStatText}>{trip.members?.length || 1} members</Text>
                                        </View>
                                        <View style={styles.tripStat}>
                                            <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                                            <Text style={styles.tripStatText}>{formatDate(trip.date)}</Text>
                                        </View>
                                        <View style={styles.shareCodeBadge}>
                                            <Text style={styles.shareCodeText}>#{trip.shareCode}</Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Create Trip Modal */}
            {renderModal(showCreateModal, setShowCreateModal, 'Plan a New Adventure', (
                <View style={styles.modalForm}>
                    <View style={styles.inputGroup}>
                        <Ionicons name="airplane-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Trip Name"
                            placeholderTextColor={COLORS.textMuted}
                            value={newTripName}
                            onChangeText={setNewTripName}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Ionicons name="location-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Destination"
                            placeholderTextColor={COLORS.textMuted}
                            value={newTripDest}
                            onChangeText={setNewTripDest}
                        />
                    </View>
                    <TouchableOpacity onPress={createTrip} disabled={creating} activeOpacity={0.8}>
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            style={styles.modalSubmitBtn}
                        >
                            {creating ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.modalSubmitText}>Create Trip</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            ))}

            {/* Join Trip Modal */}
            {renderModal(showJoinModal, setShowJoinModal, 'Join a Trip', (
                <View style={styles.modalForm}>
                    <View style={styles.inputGroup}>
                        <Ionicons name="key-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Trip Code"
                            placeholderTextColor={COLORS.textMuted}
                            value={joinCode}
                            onChangeText={setJoinCode}
                            autoCapitalize="none"
                        />
                    </View>
                    <TouchableOpacity onPress={joinTrip} activeOpacity={0.8}>
                        <LinearGradient
                            colors={['#3B82F6', '#2563EB']}
                            style={styles.modalSubmitBtn}
                        >
                            <Text style={styles.modalSubmitText}>Join Trip</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            ))}
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
    actionRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginTop: 16,
        marginBottom: 8,
    },
    actionBtn: {
        flex: 1,
        borderRadius: SIZES.radiusMd,
    },
    actionBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: SIZES.radiusMd,
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: SIZES.fontMd,
    },
    actionBtnOutline: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 13,
        borderRadius: SIZES.radiusMd,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.3)',
        backgroundColor: 'rgba(16,185,129,0.05)',
    },
    actionBtnOutlineText: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: SIZES.fontMd,
    },
    tripsList: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    loadingContainer: {
        paddingTop: 60,
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyTitle: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 16,
    },
    emptyDesc: {
        fontSize: SIZES.fontMd,
        color: COLORS.textSecondary,
        marginTop: 8,
    },
    tripCard: {
        marginBottom: 14,
        borderRadius: SIZES.radiusLg,
        ...SHADOWS.medium,
    },
    tripCardGradient: {
        borderRadius: SIZES.radiusLg,
        padding: 18,
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    tripCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    tripIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(59,130,246,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    tripCardInfo: {
        flex: 1,
    },
    tripName: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    tripMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    tripDest: {
        fontSize: SIZES.fontSm,
        color: COLORS.textMuted,
    },
    tripCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: 16,
    },
    tripStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    tripStatText: {
        fontSize: SIZES.fontXs,
        color: COLORS.textMuted,
    },
    shareCodeBadge: {
        marginLeft: 'auto',
        backgroundColor: 'rgba(16,185,129,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: SIZES.radiusFull,
    },
    shareCodeText: {
        fontSize: SIZES.fontXs,
        color: COLORS.primary,
        fontWeight: '600',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    modalContent: {
        backgroundColor: COLORS.backgroundCard,
        borderRadius: SIZES.radiusXl,
        padding: 24,
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.text,
    },
    modalForm: {
        gap: 14,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SIZES.radiusMd,
    },
    inputIcon: {
        paddingHorizontal: 14,
    },
    input: {
        flex: 1,
        height: 50,
        color: COLORS.text,
        fontSize: SIZES.fontMd,
    },
    modalSubmitBtn: {
        paddingVertical: 14,
        borderRadius: SIZES.radiusMd,
        alignItems: 'center',
        marginTop: 4,
    },
    modalSubmitText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: SIZES.fontLg,
    },
});
