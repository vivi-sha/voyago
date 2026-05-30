import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, ActivityIndicator, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { triggerSuccess, triggerLight } from '../utils/feedback';

export default function ItineraryView({ tripId, members }) {
    const { user, API_URL, fetchWithAuth } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Form state
    const [itemType, setItemType] = useState('note'); // 'note' | 'place' | 'poll'
    const [content, setContent] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);

    useEffect(() => {
        fetchItinerary();
    }, []);

    const fetchItinerary = async () => {
        try {
            const res = await fetchWithAuth(`${API_URL}/trips/${tripId}/itinerary`);
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (e) {
            console.error('Failed to fetch itinerary:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async () => {
        if (!content.trim()) {
            return Alert.alert('Error', 'Please enter some content');
        }

        let options = [];
        if (itemType === 'poll') {
            options = pollOptions.filter(o => o.trim() !== '').map(o => ({ option: o, votes: [] }));
            if (options.length < 2) return Alert.alert('Error', 'Poll must have at least 2 options');
        }

        try {
            const res = await fetchWithAuth(`${API_URL}/trips/${tripId}/itinerary`, {
                method: 'POST',
                body: JSON.stringify({
                    creatorId: user._id || user.id,
                    type: itemType,
                    content,
                    pollOptions: options
                })
            });

            if (res.ok) {
                triggerSuccess();
                setShowAddModal(false);
                setContent('');
                setPollOptions(['', '']);
                setItemType('note');
                fetchItinerary();
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to add item');
        }
    };

    const handleDeleteItem = (itemId) => {
        Alert.alert('Delete', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        const res = await fetchWithAuth(`${API_URL}/itinerary/${itemId}?userId=${user._id || user.id}`, { method: 'DELETE' });
                        if (res.ok) {
                            fetchItinerary();
                        }
                    } catch (e) {
                        Alert.alert('Error', 'Failed to delete');
                    }
                }
            }
        ]);
    };

    const handleVote = async (itemId, optionIndex) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/itinerary/${itemId}/vote`, {
                method: 'POST',
                body: JSON.stringify({
                    userId: user._id || user.id,
                    optionIndex
                })
            });
            if (res.ok) {
                triggerLight();
                fetchItinerary();
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to vote');
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />;
    }

    const userId = user._id || user.id;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Trip Itinerary</Text>
                <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addBtn}>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
            </View>

            {items.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={{ fontSize: 40 }}>🗺️</Text>
                    <Text style={styles.emptyText}>No itinerary items yet.</Text>
                    <Text style={styles.emptySubText}>Add places to visit, notes, or create a poll!</Text>
                </View>
            ) : (
                items.map((item) => {
                    const creator = members.find(m => String(m._id || m.id) === String(item.creatorId));
                    const isCreator = String(item.creatorId) === String(userId);
                    
                    return (
                        <View key={item._id || item.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.authorInfo}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{creator?.name?.charAt(0) || '?'}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.authorName}>{isCreator ? 'You' : creator?.name}</Text>
                                        <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                                    </View>
                                </View>
                                {isCreator && (
                                    <TouchableOpacity onPress={() => handleDeleteItem(item._id || item.id)}>
                                        <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.contentBox}>
                                {item.type === 'place' && <Ionicons name="location" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />}
                                {item.type === 'note' && <Ionicons name="document-text" size={20} color={COLORS.secondary} style={{ marginRight: 8 }} />}
                                {item.type === 'poll' && <Ionicons name="stats-chart" size={20} color="#F59E0B" style={{ marginRight: 8 }} />}
                                <Text style={styles.contentText}>{item.content}</Text>
                            </View>

                            {item.type === 'poll' && (
                                <View style={styles.pollContainer}>
                                    {item.pollOptions.map((opt, idx) => {
                                        const hasVoted = opt.votes.includes(userId);
                                        const totalVotes = item.pollOptions.reduce((acc, curr) => acc + curr.votes.length, 0);
                                        const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100);
                                        
                                        return (
                                            <TouchableOpacity 
                                                key={idx} 
                                                style={[styles.pollOption, hasVoted && styles.pollOptionActive]}
                                                onPress={() => handleVote(item._id || item.id, idx)}
                                                activeOpacity={0.8}
                                            >
                                                <View style={[styles.pollProgress, { width: `${percentage}%` }]} />
                                                <View style={styles.pollOptionContent}>
                                                    <Text style={[styles.pollOptionText, hasVoted && styles.pollOptionTextActive]}>
                                                        {opt.option}
                                                    </Text>
                                                    <Text style={[styles.pollVoteCount, hasVoted && styles.pollOptionTextActive]}>
                                                        {percentage}% ({opt.votes.length})
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    );
                })
            )}

            {/* Add Modal */}
            <Modal visible={showAddModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add to Itinerary</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.typeSelector}>
                            <TouchableOpacity style={[styles.typeBtn, itemType === 'note' && styles.typeBtnActive]} onPress={() => setItemType('note')}>
                                <Text style={[styles.typeBtnText, itemType === 'note' && styles.typeBtnTextActive]}>Note</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.typeBtn, itemType === 'place' && styles.typeBtnActive]} onPress={() => setItemType('place')}>
                                <Text style={[styles.typeBtnText, itemType === 'place' && styles.typeBtnTextActive]}>Place</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.typeBtn, itemType === 'poll' && styles.typeBtnActive]} onPress={() => setItemType('poll')}>
                                <Text style={[styles.typeBtnText, itemType === 'poll' && styles.typeBtnTextActive]}>Poll</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder={itemType === 'poll' ? "Ask a question..." : itemType === 'place' ? "Name of place to visit..." : "Write a note..."}
                            placeholderTextColor={COLORS.textMuted}
                            value={content}
                            onChangeText={setContent}
                            multiline
                        />

                        {itemType === 'poll' && (
                            <View style={styles.pollInputs}>
                                {pollOptions.map((opt, idx) => (
                                    <TextInput
                                        key={idx}
                                        style={styles.input}
                                        placeholder={`Option ${idx + 1}`}
                                        placeholderTextColor={COLORS.textMuted}
                                        value={opt}
                                        onChangeText={(val) => {
                                            const newOpts = [...pollOptions];
                                            newOpts[idx] = val;
                                            setPollOptions(newOpts);
                                        }}
                                    />
                                ))}
                                {pollOptions.length < 5 && (
                                    <TouchableOpacity style={styles.addOptionBtn} onPress={() => setPollOptions([...pollOptions, ''])}>
                                        <Text style={styles.addOptionText}>+ Add Option</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        <TouchableOpacity onPress={handleAddItem} style={styles.submitBtn}>
                            <LinearGradient colors={['#10B981', '#059669']} style={styles.submitGradient}>
                                <Text style={styles.submitBtnText}>Post to Itinerary</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.text,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    addBtnText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 4,
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    emptyText: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '700',
        marginTop: 12,
    },
    emptySubText: {
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: 8,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    authorName: {
        color: COLORS.text,
        fontWeight: '700',
        fontSize: 15,
    },
    dateText: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    contentBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contentText: {
        color: COLORS.text,
        fontSize: 16,
        lineHeight: 24,
        flex: 1,
    },
    pollContainer: {
        marginTop: 16,
        gap: 8,
    },
    pollOption: {
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    pollOptionActive: {
        borderColor: COLORS.primary,
    },
    pollProgress: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
    },
    pollOptionContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    pollOptionText: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
    },
    pollOptionTextActive: {
        color: COLORS.primary,
    },
    pollVoteCount: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1E293B',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
    },
    typeSelector: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 4,
        marginBottom: 20,
    },
    typeBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    typeBtnActive: {
        backgroundColor: COLORS.primary,
    },
    typeBtnText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    typeBtnTextActive: {
        color: '#fff',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 16,
    },
    pollInputs: {
        marginTop: 8,
    },
    addOptionBtn: {
        padding: 12,
        alignItems: 'center',
    },
    addOptionText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    submitBtn: {
        marginTop: 10,
        marginBottom: 40,
        borderRadius: 12,
        overflow: 'hidden',
    },
    submitGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
