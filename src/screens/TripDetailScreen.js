import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, ActivityIndicator, Modal, Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth, API_URL } from '../context/AuthContext';

export default function TripDetailScreen({ route, navigation }) {
    const { tripId } = route.params;
    const { user } = useAuth();
    const [trip, setTrip] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseDesc, setExpenseDesc] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [isEcoFriendly, setIsEcoFriendly] = useState(false);

    useEffect(() => {
        fetchTripData();
    }, []);

    const fetchTripData = async () => {
        try {
            const [tripRes, expRes] = await Promise.all([
                fetch(`${API_URL}/trips/${tripId}`),
                fetch(`${API_URL}/expenses?tripId=${tripId}`),
            ]);

            if (tripRes.ok) {
                const tripData = await tripRes.json();
                setTrip(tripData);

                // Fetch member details
                if (tripData.members?.length) {
                    const memberPromises = tripData.members.map(id =>
                        fetch(`${API_URL}/users/${id}`).then(r => r.ok ? r.json() : null)
                    );
                    const memberData = await Promise.all(memberPromises);
                    setMembers(memberData.filter(Boolean));
                }
            }

            if (expRes.ok) {
                const expData = await expRes.json();
                setExpenses(expData);
            }
        } catch (e) {
            console.error('Failed to fetch trip data:', e);
        } finally {
            setLoading(false);
        }
    };

    const addExpense = async () => {
        if (!expenseDesc.trim() || !expenseAmount.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tripId,
                    description: expenseDesc,
                    amount: parseFloat(expenseAmount),
                    payerId: user._id || user.id,
                    splitWith: trip.members,
                    isEcoFriendly,
                }),
            });
            if (res.ok) {
                setShowExpenseModal(false);
                setExpenseDesc('');
                setExpenseAmount('');
                setIsEcoFriendly(false);
                fetchTripData();
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to add expense');
        }
    };

    const shareTrip = async () => {
        try {
            await Share.share({
                message: `Join my trip "${trip.name}" on Voyago! Use code: ${trip.shareCode}`,
            });
        } catch (e) {
            console.error(e);
        }
    };

    const userId = user?._id || user?.id;
    if (!userId) return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    // Guard: trip fetch failed
    if (!trip) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
                <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Trip Not Found</Text>
                <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 }}>
                    Could not load trip data. Please check your connection and try again.
                </Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const myExpenses = expenses.filter(e => String(e.payerId) === String(userId));
    const myPaid = myExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const myShare = totalExpenses / (members.length || 1);
    const balance = myPaid - myShare;

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Header */}
                <LinearGradient colors={['#0F172A', '#1a2942']} style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <Text style={styles.tripName}>{trip?.name || 'Trip'}</Text>
                    <View style={styles.tripMeta}>
                        <Ionicons name="location" size={16} color={COLORS.primary} />
                        <Text style={styles.tripDest}>{trip?.destination}</Text>
                    </View>

                    <TouchableOpacity style={styles.shareBtn} onPress={shareTrip}>
                        <Ionicons name="share-social-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.shareBtnText}>Invite Friends • #{trip?.shareCode}</Text>
                    </TouchableOpacity>
                </LinearGradient>

                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Cost</Text>
                        <Text style={styles.statValue}>₹{totalExpenses.toFixed(2)}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Your Balance</Text>
                        <Text style={[styles.statValue, { color: balance >= 0 ? COLORS.primary : COLORS.error }]}>
                            {balance >= 0 ? '+' : '-'}₹{Math.abs(balance).toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Members</Text>
                        <Text style={styles.statValue}>{members.length}</Text>
                    </View>
                </View>

                {/* Members */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Members</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.membersRow}>
                            {members.map((m, i) => (
                                <View key={i} style={styles.memberChip}>
                                    <LinearGradient
                                        colors={i === 0 ? ['#10B981', '#059669'] : ['#3B82F6', '#2563EB']}
                                        style={styles.memberAvatar}
                                    >
                                        <Text style={styles.memberAvatarText}>
                                            {m.name?.charAt(0)?.toUpperCase() || '?'}
                                        </Text>
                                    </LinearGradient>
                                    <Text style={styles.memberName} numberOfLines={1}>
                                        {String(m._id || m.id) === String(userId) ? 'You' : m.name}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* Expenses */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Expenses</Text>
                        <TouchableOpacity
                            onPress={() => setShowExpenseModal(true)}
                            style={styles.addExpBtn}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add" size={18} color="#fff" />
                            <Text style={styles.addExpBtnText}>Add</Text>
                        </TouchableOpacity>
                    </View>

                    {expenses.length === 0 ? (
                        <View style={styles.emptyExpenses}>
                            <Text style={{ fontSize: 36 }}>🧾</Text>
                            <Text style={styles.emptyText}>No expenses yet</Text>
                        </View>
                    ) : (
                        expenses.map((exp, i) => {
                            const payer = members.find(m => String(m._id || m.id) === String(exp.payerId));
                            return (
                                <View key={exp._id || exp.id || i} style={styles.expenseCard}>
                                    <View style={styles.expenseIcon}>
                                        <Text style={{ fontSize: 20 }}>
                                            {exp.isEcoFriendly ? '🌱' : '🧾'}
                                        </Text>
                                    </View>
                                    <View style={styles.expenseInfo}>
                                        <Text style={styles.expenseDesc}>{exp.description}</Text>
                                        <Text style={styles.expensePayer}>
                                            Paid by {String(payer?._id || payer?.id) === String(userId) ? 'You' : payer?.name || 'Unknown'}
                                        </Text>
                                    </View>
                                    <View style={styles.expenseAmountBox}>
                                        <Text style={styles.expenseAmount}>₹{exp.amount}</Text>
                                        {exp.isEcoFriendly && (
                                            <View style={styles.ecoBadge}>
                                                <Text style={styles.ecoBadgeText}>Eco</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                {/* Settlement Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How to Settle Up 💸</Text>
                    <View style={styles.settlementCard}>
                        {members.length > 1 ? (
                            <>
                                <Text style={styles.settlementText}>
                                    Per person share: ₹{(totalExpenses / members.length).toFixed(2)}
                                </Text>
                                {members.map((m, i) => {
                                    const paid = expenses
                                        .filter(e => String(e.payerId) === String(m._id || m.id))
                                        .reduce((s, e) => s + e.amount, 0);
                                    const share = totalExpenses / members.length;
                                    const diff = paid - share;
                                    return (
                                        <View key={i} style={styles.settlementRow}>
                                            <Text style={styles.settlementName}>
                                                {String(m._id || m.id) === String(userId) ? 'You' : m.name}
                                            </Text>
                                            <Text style={[styles.settlementAmount, {
                                                color: diff >= 0 ? COLORS.primary : COLORS.error
                                            }]}>
                                                {diff >= 0 ? `Gets back ₹${diff.toFixed(2)}` : `Owes ₹${Math.abs(diff).toFixed(2)}`}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </>
                        ) : (
                            <Text style={styles.settlementText}>Add more members to split expenses</Text>
                        )}
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Add Expense Modal */}
            <Modal visible={showExpenseModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Expense</Text>
                            <TouchableOpacity onPress={() => setShowExpenseModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalForm}>
                            <View style={styles.inputGroup}>
                                <Ionicons name="receipt-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Description"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={expenseDesc}
                                    onChangeText={setExpenseDesc}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.currencySymbol}>₹</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Amount"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={expenseAmount}
                                    onChangeText={setExpenseAmount}
                                    keyboardType="decimal-pad"
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.ecoToggle}
                                onPress={() => setIsEcoFriendly(!isEcoFriendly)}
                            >
                                <View style={[styles.checkbox, isEcoFriendly && styles.checkboxActive]}>
                                    {isEcoFriendly && <Ionicons name="checkmark" size={16} color="#fff" />}
                                </View>
                                <Text style={styles.ecoToggleText}>🌱 Eco-Friendly Expense (+10 Eco Points)</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={addExpense} activeOpacity={0.8}>
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    style={styles.modalSubmitBtn}
                                >
                                    <Text style={styles.modalSubmitText}>Add Expense</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingTop: 50,
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
    tripName: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 6,
    },
    tripMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    tripDest: {
        fontSize: SIZES.fontMd,
        color: COLORS.textSecondary,
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: SIZES.radiusMd,
        alignSelf: 'flex-start',
    },
    shareBtnText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: SIZES.fontSm,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 10,
        marginTop: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.backgroundCard,
        borderRadius: SIZES.radiusMd,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    statLabel: {
        fontSize: SIZES.fontXs,
        color: COLORS.textMuted,
        marginBottom: 6,
    },
    statValue: {
        fontSize: SIZES.fontLg,
        fontWeight: '800',
        color: COLORS.text,
    },
    section: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 14,
    },
    membersRow: {
        flexDirection: 'row',
        gap: 14,
    },
    memberChip: {
        alignItems: 'center',
        gap: 6,
    },
    memberAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    memberAvatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    memberName: {
        fontSize: SIZES.fontXs,
        color: COLORS.textSecondary,
        maxWidth: 60,
        textAlign: 'center',
    },
    addExpBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: SIZES.radiusFull,
    },
    addExpBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: SIZES.fontSm,
    },
    emptyExpenses: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        fontSize: SIZES.fontMd,
        color: COLORS.textMuted,
        marginTop: 8,
    },
    expenseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundCard,
        borderRadius: SIZES.radiusMd,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    expenseIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    expenseInfo: {
        flex: 1,
    },
    expenseDesc: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    expensePayer: {
        fontSize: SIZES.fontXs,
        color: COLORS.textMuted,
    },
    expenseAmountBox: {
        alignItems: 'flex-end',
    },
    expenseAmount: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.text,
    },
    ecoBadge: {
        backgroundColor: 'rgba(16,185,129,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 4,
    },
    ecoBadgeText: {
        fontSize: 10,
        color: COLORS.primary,
        fontWeight: '600',
    },
    settlementCard: {
        backgroundColor: COLORS.backgroundCard,
        borderRadius: SIZES.radiusLg,
        padding: 18,
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    settlementText: {
        fontSize: SIZES.fontMd,
        color: COLORS.textSecondary,
        marginBottom: 12,
    },
    settlementRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    settlementName: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.text,
    },
    settlementAmount: {
        fontSize: SIZES.fontSm,
        fontWeight: '600',
    },
    // Modal styles
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
    currencySymbol: {
        paddingHorizontal: 14,
        fontSize: 18,
        color: COLORS.textMuted,
    },
    input: {
        flex: 1,
        height: 50,
        color: COLORS.text,
        fontSize: SIZES.fontMd,
    },
    ecoToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 4,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    ecoToggleText: {
        fontSize: SIZES.fontSm,
        color: COLORS.textSecondary,
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
