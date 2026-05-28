import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, ActivityIndicator, Modal, Share, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth, API_URL } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { parseReceipt } from '../utils/receiptParser';
import EcoMap from '../components/EcoMap';
import { triggerSuccess, playEcoChime, triggerLight } from '../utils/feedback';
import * as Linking from 'expo-linking';

export default function TripDetailScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const { trip: initialTrip } = route.params;
    const { user, API_URL, fetchWithAuth, refreshUser } = useAuth();
    const [trip, setTrip] = useState(initialTrip);
    const [expenses, setExpenses] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseDesc, setExpenseDesc] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [isEcoFriendly, setIsEcoFriendly] = useState(false);
    const [expensePayerId, setExpensePayerId] = useState('');
    const [expenseSplitWith, setExpenseSplitWith] = useState([]);
    const [editingExpenseId, setEditingExpenseId] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [proofImageBase64, setProofImageBase64] = useState(null);
    const [proofLocation, setProofLocation] = useState(null);
    const [proofTime, setProofTime] = useState(null);
    const [showProofModal, setShowProofModal] = useState(false);
    const [selectedProofExpense, setSelectedProofExpense] = useState(null);

    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [showEditTripModal, setShowEditTripModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [editTripName, setEditTripName] = useState(initialTrip.name || '');
    const [editTripDest, setEditTripDest] = useState(initialTrip.destination || '');
    const [newCreatorId, setNewCreatorId] = useState(null);

    useEffect(() => {
        fetchTripData();
    }, []);

    const fetchTripData = async () => {
        try {
            const [tripRes, expRes] = await Promise.all([
                fetchWithAuth(`${API_URL}/trips/${initialTrip._id || initialTrip.id}`),
                fetchWithAuth(`${API_URL}/expenses?tripId=${initialTrip._id || initialTrip.id}`),
            ]);

            if (tripRes.ok) {
                const tripData = await tripRes.json();
                setTrip(tripData);

                // Fetch member details
                if (tripData.members?.length) {
                    const memberPromises = tripData.members.map(id =>
                        fetchWithAuth(`${API_URL}/users/${id}`).then(r => r.ok ? r.json() : null)
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

    const handleScanReceipt = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera permissions to scan receipts.');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setScanning(true);
            try {
                const parsed = await parseReceipt(result.assets[0].base64);
                setExpenseDesc(`${parsed.merchant} (Scanned)`);
                setExpenseAmount(String(parsed.amount));
                
                // Note: We don't auto-set isEcoFriendly to true here anymore
                // because enabling it now requires a proof picture prompt
                if (parsed.isEcoFriendly) {
                    Alert.alert("Eco Match", "This looks like an eco-friendly purchase! Tap the Eco-Friendly toggle below to upload a proof picture and claim your points.");
                }
            } catch (e) {
                Alert.alert('Scan Failed', 'Could not read the receipt or OCR service unavailable.');
            } finally {
                setScanning(false);
            }
        }
    };

    const handleToggleEcoFriendly = () => {
        if (isEcoFriendly) {
            setIsEcoFriendly(false);
            setProofImageBase64(null);
            setProofLocation(null);
            setProofTime(null);
            return;
        }

        Alert.alert('Eco-Proof Required', 'To claim Eco-Points, please take a picture as proof (e.g., transit ticket or receipt).', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Take Picture', onPress: async () => {
                const camPerm = await ImagePicker.requestCameraPermissionsAsync();
                const locPerm = await Location.requestForegroundPermissionsAsync();
                
                if (camPerm.status !== 'granted' || locPerm.status !== 'granted') {
                    Alert.alert('Permission Denied', 'Camera and Location permissions are required for eco-proof.');
                    return;
                }

                let result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    quality: 0.2, // highly compressed for db storage
                    base64: true,
                });

                if (!result.canceled && result.assets[0].base64) {
                    setScanning(true);
                    try {
                        let loc = await Location.getLastKnownPositionAsync({});
                        if (!loc) {
                            loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
                        }
                        setProofLocation({ latitude: loc?.coords?.latitude || 0, longitude: loc?.coords?.longitude || 0 });
                    } catch (e) {
                        console.log('Location fetch failed, using fallback.');
                        setProofLocation({ latitude: 0, longitude: 0 }); // Fallback
                    }
                    setProofImageBase64(result.assets[0].base64);
                    setProofTime(new Date());
                    setIsEcoFriendly(true);
                    setScanning(false);
                }
            }}
        ]);
    };

    const openAddExpense = () => {
        setExpenseDesc('');
        setExpenseAmount('');
        setIsEcoFriendly(false);
        setProofImageBase64(null);
        setProofLocation(null);
        setProofTime(null);
        setExpensePayerId(user._id || user.id);
        setExpenseSplitWith(members.map(m => m._id || m.id));
        setEditingExpenseId(null);
        setShowExpenseModal(true);
    };

    const openEditExpense = (exp) => {
        setExpenseDesc(exp.description);
        setExpenseAmount(String(exp.amount));
        setIsEcoFriendly(exp.isEcoFriendly);
        setExpensePayerId(exp.payerId);
        setExpenseSplitWith(exp.splitWith || members.map(m => m._id || m.id));
        setEditingExpenseId(exp._id || exp.id);
        setShowExpenseModal(true);
    };

    const deleteExpense = (expId) => {
        Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const res = await fetchWithAuth(`${API_URL}/expenses/${expId}`, { method: 'DELETE' });
                        if (res.ok) {
                            fetchTripData();
                            refreshUser();
                        }
                    } catch (e) {
                        Alert.alert('Error', 'Failed to delete expense');
                    }
                }
            }
        ]);
    };

    const toggleSplitMember = (memberId) => {
        setExpenseSplitWith(prev => 
            prev.includes(memberId) 
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const saveExpense = async () => {
        if (!expenseDesc.trim() || !expenseAmount.trim() || !expensePayerId || expenseSplitWith.length === 0) {
            Alert.alert('Error', 'Please fill in all fields and select at least one person to split with.');
            return;
        }
        
        try {
            const body = {
                tripId: trip._id || trip.id,
                description: expenseDesc,
                amount: Number(expenseAmount),
                payerId: expensePayerId,
                splitWith: expenseSplitWith,
                isEcoFriendly,
                proofImageBase64,
                proofLocation,
                proofTime,
            };

            const url = editingExpenseId ? `${API_URL}/expenses/${editingExpenseId}` : `${API_URL}/expenses`;
            const method = editingExpenseId ? 'PUT' : 'POST';

            const res = await fetchWithAuth(url, {
                method,
                body: JSON.stringify(body),
            });
            
            if (res.ok) {
                if (isEcoFriendly && !editingExpenseId) {
                    triggerSuccess();
                    playEcoChime();
                } else if (!editingExpenseId) {
                    triggerLight();
                }
                setShowExpenseModal(false);
                fetchTripData();
                refreshUser();
            } else {
                const errorData = await res.json().catch(() => ({}));
                Alert.alert('Error', errorData.error || 'Failed to save expense');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to save expense');
        }
    };

    const handleEditTrip = async () => {
        if (!editTripName.trim() || !editTripDest.trim()) {
            return Alert.alert('Error', 'Name and destination are required');
        }
        try {
            const res = await fetchWithAuth(`${API_URL}/trips/${trip._id || trip.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editTripName, destination: editTripDest })
            });
            if (res.ok) {
                const updated = await res.json();
                setTrip(updated);
                setShowEditTripModal(false);
                triggerSuccess();
            } else {
                Alert.alert('Error', 'Failed to update trip');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to update trip');
        }
    };

    const handleDeleteTrip = () => {
        Alert.alert('Delete Trip', 'Are you sure you want to delete this trip and all its expenses? This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        const res = await fetchWithAuth(`${API_URL}/trips/${trip._id || trip.id}?userId=${userId}`, { method: 'DELETE' });
                        if (res.ok) {
                            triggerSuccess();
                            navigation.goBack();
                        } else {
                            const data = await res.json();
                            Alert.alert('Error', data.error || 'Failed to delete trip');
                        }
                    } catch (e) {
                        Alert.alert('Error', 'Failed to delete trip');
                    }
                }
            }
        ]);
    };

    const handleLeaveTrip = async () => {
        if (String(trip.creatorId) === String(userId) && members.length > 1 && !newCreatorId) {
            return Alert.alert('Error', 'You must select a new creator before leaving.');
        }
        try {
            const res = await fetchWithAuth(`${API_URL}/trips/${trip._id || trip.id}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newCreatorId })
            });
            if (res.ok) {
                triggerSuccess();
                navigation.goBack();
            } else {
                const data = await res.json();
                Alert.alert('Error', data.error || 'Failed to leave trip');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to leave trip');
        }
    };

    const shareTrip = async () => {
        try {
            // Production Vercel URL that redirects to voyago:// custom scheme
            const shareableLink = `https://ecoshare-eight.vercel.app/api/join/${trip.shareCode}`;
            
            await Share.share({
                message: `🌍 You've been invited to join the trip "${trip.name}" on Voyago!\n\nClick to join:\n${shareableLink}\n\n(Or enter code manually: *${trip.shareCode}*)`,
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

    const calculateSettlement = () => {
        let balances = {};
        members.forEach(m => { balances[m._id || m.id] = 0; });
        
        expenses.forEach(exp => {
            const amount = exp.amount || 0;
            const payerId = exp.payerId;
            const splitWith = exp.splitWith?.length > 0 ? exp.splitWith : members.map(m => m._id || m.id);
            
            if (balances[payerId] !== undefined) {
                balances[payerId] += amount;
            }
            
            const splitAmount = amount / splitWith.length;
            splitWith.forEach(id => {
                if (balances[id] !== undefined) {
                    balances[id] -= splitAmount;
                }
            });
        });

        let debtors = [];
        let creditors = [];
        Object.keys(balances).forEach(id => {
            if (balances[id] > 0.01) creditors.push({ id, amount: balances[id] });
            else if (balances[id] < -0.01) debtors.push({ id, amount: -balances[id] });
        });

        let settlements = [];
        let i = 0, j = 0;
        while (i < debtors.length && j < creditors.length) {
            let debtor = debtors[i];
            let creditor = creditors[j];
            let amount = Math.min(debtor.amount, creditor.amount);
            
            settlements.push({
                from: debtor.id,
                to: creditor.id,
                amount: amount
            });
            
            debtor.amount -= amount;
            creditor.amount -= amount;
            
            if (debtor.amount < 0.01) i++;
            if (creditor.amount < 0.01) j++;
        }
        
        return { balances, settlements };
    };

    const { balances, settlements } = members.length > 0 ? calculateSettlement() : { balances: {}, settlements: [] };
    const myBalance = balances[String(userId)] || 0;
    const youPaid = expenses.filter(e => String(e.payerId) === String(userId)).reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Header */}
                <LinearGradient colors={['#0F172A', '#1a2942']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <View style={{ position: 'absolute', top: insets.top + 16, right: 16, zIndex: 10 }}>
                        <TouchableOpacity onPress={() => setShowOptionsModal(true)} style={{ padding: 8 }}>
                            <Ionicons name="ellipsis-vertical" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
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
                        <Text style={styles.statLabel}>You Paid</Text>
                        <Text style={[styles.statValue, { color: COLORS.primary }]}>
                            ₹{youPaid.toFixed(2)}
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

                {/* Eco-Hotspot Map */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tourist Attractions 🗺️</Text>
                    <EcoMap destination={trip.destination} />
                </View>

                {/* Expenses */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Expenses</Text>
                        <TouchableOpacity
                            onPress={openAddExpense}
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
                            const expId = exp._id || exp.id || i;
                            const payer = members.find(m => String(m._id || m.id) === String(exp.payerId));
                            return (
                                <View key={expId} style={styles.expenseCard}>
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
                                        <Text style={styles.expenseSplitInfo}>
                                            Split with {exp.splitWith?.length || members.length} people
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
                                    <View style={styles.expenseActions}>
                                        {exp.isEcoFriendly && exp.proofImageBase64 && (
                                            <TouchableOpacity onPress={() => {
                                                setSelectedProofExpense(exp);
                                                setShowProofModal(true);
                                            }} style={styles.expActionBtn}>
                                                <Ionicons name="eye" size={16} color="#10B981" />
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity onPress={() => openEditExpense(exp)} style={styles.expActionBtn}>
                                            <Ionicons name="pencil" size={16} color={COLORS.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => deleteExpense(expId)} style={styles.expActionBtn}>
                                            <Ionicons name="trash" size={16} color={COLORS.error} />
                                        </TouchableOpacity>
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
                        {settlements.length > 0 ? (
                            settlements.map((s, i) => {
                                const fromMember = members.find(m => String(m._id || m.id) === String(s.from));
                                const toMember = members.find(m => String(m._id || m.id) === String(s.to));
                                const fromName = String(s.from) === String(userId) ? 'You' : fromMember?.name;
                                const toName = String(s.to) === String(userId) ? 'You' : toMember?.name;
                                
                                return (
                                    <View key={i} style={[styles.settlementRow, { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                                                <Ionicons name="wallet" size={20} color={COLORS.primary} />
                                            </View>
                                            <View>
                                                <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                                                    <Text style={{ color: COLORS.text, fontWeight: '700' }}>{fromName}</Text> needs to pay
                                                </Text>
                                                <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: '800', marginTop: 2 }}>
                                                    {toName}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={{ color: COLORS.error, fontSize: 16, fontWeight: '800' }}>
                                                ₹{s.amount.toFixed(2)}
                                            </Text>
                                            {String(s.from) === String(userId) && (
                                                <TouchableOpacity style={{ marginTop: 8, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                                                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Pay Now</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            <View style={{ alignItems: 'center', padding: 20 }}>
                                <Text style={{ fontSize: 40, marginBottom: 10 }}>🎉</Text>
                                <Text style={styles.settlementText}>
                                    {members.length > 1 ? "Everyone is settled up! Zero balances." : "Add more members to split expenses."}
                                </Text>
                            </View>
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
                            <TouchableOpacity style={styles.scanBtn} onPress={handleScanReceipt} activeOpacity={0.8}>
                                {scanning ? (
                                    <ActivityIndicator color={COLORS.primary} size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="camera" size={20} color={COLORS.primary} />
                                        <Text style={styles.scanBtnText}>📸 Scan Receipt</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR MANUAL ENTRY</Text>
                                <View style={styles.dividerLine} />
                            </View>

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

                            <Text style={styles.formLabel}>Paid By</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                                {members.map(m => {
                                    const mId = m._id || m.id;
                                    const isSelected = String(expensePayerId) === String(mId);
                                    return (
                                        <TouchableOpacity
                                            key={mId}
                                            style={[styles.choiceChip, isSelected && styles.choiceChipActive]}
                                            onPress={() => setExpensePayerId(mId)}
                                        >
                                            <Text style={[styles.choiceChipText, isSelected && styles.choiceChipTextActive]}>
                                                {String(mId) === String(userId) ? 'You' : m.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            <Text style={styles.formLabel}>Split With</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                                {members.map(m => {
                                    const mId = m._id || m.id;
                                    const isSelected = expenseSplitWith.includes(mId);
                                    return (
                                        <TouchableOpacity
                                            key={mId}
                                            style={[styles.choiceChip, isSelected && styles.choiceChipActive]}
                                            onPress={() => toggleSplitMember(mId)}
                                        >
                                            <Text style={[styles.choiceChipText, isSelected && styles.choiceChipTextActive]}>
                                                {String(mId) === String(userId) ? 'You' : m.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            <TouchableOpacity
                                style={styles.ecoToggle}
                                onPress={handleToggleEcoFriendly}
                            >
                                <View style={[styles.checkbox, isEcoFriendly && styles.checkboxActive]}>
                                    {isEcoFriendly && <Ionicons name="checkmark" size={16} color="#fff" />}
                                </View>
                                <Text style={styles.ecoToggleText}>🌱 Eco-Friendly Expense (+15 Eco Points)</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={saveExpense} activeOpacity={0.8}>
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    style={styles.modalSubmitBtn}
                                >
                                    <Text style={styles.modalSubmitText}>{editingExpenseId ? 'Save Changes' : 'Add Expense'}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Proof Modal */}
            <Modal visible={showProofModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Eco Proof</Text>
                            <TouchableOpacity onPress={() => setShowProofModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        {selectedProofExpense && (
                            <View style={{ alignItems: 'center', marginTop: 10 }}>
                                <Image 
                                    source={{ uri: `data:image/jpeg;base64,${selectedProofExpense.proofImageBase64}` }} 
                                    style={{ width: '100%', height: 300, borderRadius: 10, resizeMode: 'cover' }} 
                                />
                                {selectedProofExpense.proofTime && (
                                    <View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8 }}>
                                        <Ionicons name="time" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
                                        <Text style={{ color: COLORS.text, fontSize: 16 }}>
                                            {new Date(selectedProofExpense.proofTime).toLocaleString()}
                                        </Text>
                                    </View>
                                )}
                                {selectedProofExpense.proofLocation && (
                                    <TouchableOpacity 
                                        style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border }}
                                        onPress={() => {
                                            const { latitude, longitude } = selectedProofExpense.proofLocation;
                                            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
                                        }}
                                    >
                                        <Ionicons name="map" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
                                        <Text style={{ color: COLORS.text, fontSize: 16, flex: 1 }}>View Location on Map</Text>
                                        <Ionicons name="open-outline" size={16} color={COLORS.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Options Modal */}
            <Modal visible={showOptionsModal} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOptionsModal(false)}>
                    <View style={[styles.modalContent, { marginTop: 'auto', marginBottom: 40, marginHorizontal: 20 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Trip Options</Text>
                            <TouchableOpacity onPress={() => setShowOptionsModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        
                        <TouchableOpacity 
                            style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                            onPress={() => { setShowOptionsModal(false); setShowEditTripModal(true); }}
                        >
                            <Ionicons name="pencil" size={20} color={COLORS.text} />
                            <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '600' }}>Edit Trip Details</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={{ paddingVertical: 16, borderBottomWidth: String(trip?.creatorId) === String(userId) ? 1 : 0, borderBottomColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                            onPress={() => {
                                setShowOptionsModal(false);
                                if (String(trip?.creatorId) === String(userId) && members.length > 1) {
                                    setShowLeaveModal(true);
                                } else {
                                    Alert.alert('Leave Trip', 'Are you sure you want to leave this trip?', [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Leave', style: 'destructive', onPress: handleLeaveTrip }
                                    ]);
                                }
                            }}
                        >
                            <Ionicons name="exit-outline" size={20} color={COLORS.error} />
                            <Text style={{ color: COLORS.error, fontSize: 16, fontWeight: '600' }}>Leave Trip</Text>
                        </TouchableOpacity>
                        
                        {String(trip?.creatorId) === String(userId) && (
                            <TouchableOpacity 
                                style={{ paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                                onPress={() => { setShowOptionsModal(false); handleDeleteTrip(); }}
                            >
                                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                                <Text style={{ color: COLORS.error, fontSize: 16, fontWeight: '600' }}>Delete Trip</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Edit Trip Modal */}
            <Modal visible={showEditTripModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Trip</Text>
                            <TouchableOpacity onPress={() => setShowEditTripModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        
                        <Text style={styles.formLabel}>Trip Name</Text>
                        <View style={styles.inputGroup}>
                            <Ionicons name="text-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Summer Vacation"
                                placeholderTextColor={COLORS.textSecondary}
                                value={editTripName}
                                onChangeText={setEditTripName}
                            />
                        </View>
                        
                        <Text style={styles.formLabel}>Destination</Text>
                        <View style={styles.inputGroup}>
                            <Ionicons name="location-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Hawaii"
                                placeholderTextColor={COLORS.textSecondary}
                                value={editTripDest}
                                onChangeText={setEditTripDest}
                            />
                        </View>

                        <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleEditTrip}>
                            <LinearGradient colors={['#10B981', '#059669']} style={[StyleSheet.absoluteFill, { borderRadius: SIZES.radiusMd }]} />
                            <Text style={styles.modalSubmitText}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Leave Trip Modal (For Creator) */}
            <Modal visible={showLeaveModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Assign New Creator</Text>
                            <TouchableOpacity onPress={() => setShowLeaveModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        
                        <Text style={{ color: COLORS.textSecondary, marginBottom: 16 }}>
                            Since you created this trip, you must assign someone else to manage it before you can leave.
                        </Text>
                        
                        <ScrollView style={{ maxHeight: 200, marginBottom: 16 }}>
                            {members.filter(m => String(m._id || m.id) !== String(userId)).map(m => (
                                <TouchableOpacity 
                                    key={m._id || m.id}
                                    style={[{ padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }, newCreatorId === (m._id || m.id) && { borderColor: COLORS.primary, backgroundColor: 'rgba(16,185,129,0.1)' }]}
                                    onPress={() => setNewCreatorId(m._id || m.id)}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: COLORS.text, fontWeight: '700' }}>{m.name}</Text>
                                        <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{m.email}</Text>
                                    </View>
                                    {newCreatorId === (m._id || m.id) && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity 
                            style={[styles.modalSubmitBtn, { opacity: newCreatorId ? 1 : 0.5 }]} 
                            disabled={!newCreatorId}
                            onPress={handleLeaveTrip}
                        >
                            <LinearGradient colors={['#EF4444', '#DC2626']} style={[StyleSheet.absoluteFill, { borderRadius: SIZES.radiusMd }]} />
                            <Text style={styles.modalSubmitText}>Confirm Leave</Text>
                        </TouchableOpacity>
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
    expenseSplitInfo: {
        fontSize: 10,
        color: COLORS.primary,
        marginTop: 2,
    },
    expenseAmountBox: {
        alignItems: 'flex-end',
        marginRight: 12,
    },
    expenseAmount: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.text,
    },
    expenseActions: {
        flexDirection: 'row',
        gap: 8,
        paddingLeft: 8,
        borderLeftWidth: 1,
        borderLeftColor: COLORS.border,
    },
    expActionBtn: {
        padding: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
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
    scanBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.3)',
        borderRadius: SIZES.radiusMd,
        paddingVertical: 12,
    },
    scanBtnText: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: SIZES.fontMd,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        color: COLORS.textMuted,
        paddingHorizontal: 12,
        fontSize: 10,
        fontWeight: '700',
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
    formLabel: {
        color: COLORS.text,
        fontSize: SIZES.fontSm,
        fontWeight: '700',
        marginTop: 8,
        marginBottom: -6,
    },
    chipRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    choiceChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: SIZES.radiusFull,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 8,
    },
    choiceChipActive: {
        backgroundColor: 'rgba(16,185,129,0.15)',
        borderColor: COLORS.primary,
    },
    choiceChipText: {
        color: COLORS.textSecondary,
        fontSize: SIZES.fontSm,
        fontWeight: '600',
    },
    choiceChipTextActive: {
        color: COLORS.primary,
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
