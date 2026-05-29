import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { getDailyChallenge } from '../data/challenges';
import { useAuth } from '../context/AuthContext';
import { triggerSuccess, triggerCelebration } from '../utils/feedback';

export default function DailyChallengeCard({ user, refreshUser }) {
    const { API_URL, fetchWithAuth } = useAuth();
    const [challenge, setChallenge] = useState(null);
    const [status, setStatus] = useState('unanswered'); // unanswered, correct, incorrect, completed
    const [selectedOption, setSelectedOption] = useState(null);
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    
    const todayStr = new Date().toDateString();

    useFocusEffect(
        useCallback(() => {
            loadChallenge();
        }, [])
    );

    const loadChallenge = async () => {
        const currentChallenge = getDailyChallenge();
        setChallenge(currentChallenge);

        try {
            const savedStatus = await AsyncStorage.getItem(`challenge_${todayStr}`);
            if (savedStatus) {
                setStatus(savedStatus);
            } else {
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 5,
                    useNativeDriver: true
                }).start();
            }
        } catch (e) {
            console.error('Failed to load challenge state');
        }
    };

    const handleAnswer = async (index) => {
        setSelectedOption(index);
        let newStatus = 'incorrect';
        
        if (challenge.type === 'trivia') {
            if (index === challenge.correctIndex) {
                newStatus = 'correct';
            }
        } else {
            newStatus = 'completed';
        }

        setStatus(newStatus);
        
        try {
            await AsyncStorage.setItem(`challenge_${todayStr}`, newStatus);
        } catch (e) {}

        if (newStatus === 'correct' || newStatus === 'completed') {
            triggerCelebration();
            await awardPoints(challenge.points);
        } else {
            triggerSuccess(); // Just a light feedback for incorrect
        }
    };

    const awardPoints = async (points) => {
        const userId = user?._id || user?.id;
        if (!userId) return;
        try {
            const res = await fetchWithAuth(`${API_URL}/users/${userId}/add-points`, {
                method: 'POST',
                body: JSON.stringify({ points, reason: 'daily_challenge' })
            });
            if (res.ok) {
                refreshUser();
            }
        } catch (e) {
            console.error('Failed to award points', e);
        }
    };

    if (!challenge) return null;

    return (
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient
                colors={['rgba(16,185,129,0.1)', 'rgba(15,23,42,0.8)']}
                style={styles.gradient}
            >
                <View style={styles.header}>
                    <Ionicons name="sunny" size={24} color={COLORS.accent} />
                    <Text style={styles.title}>Daily Green Challenge</Text>
                    <View style={styles.pointsBadge}>
                        <Text style={styles.pointsText}>+{challenge.points} Pts</Text>
                    </View>
                </View>

                <Text style={styles.question}>{challenge.question}</Text>

                {status === 'unanswered' ? (
                    <View style={styles.optionsContainer}>
                        {challenge.type === 'trivia' ? (
                            challenge.options.map((opt, i) => (
                                <TouchableOpacity 
                                    key={i} 
                                    style={styles.optionBtn}
                                    onPress={() => handleAnswer(i)}
                                >
                                    <Text style={styles.optionText}>{opt}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <TouchableOpacity 
                                style={styles.primaryBtn}
                                onPress={() => handleAnswer(0)}
                            >
                                <Text style={styles.primaryBtnText}>I Did It! 🌿</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View style={styles.resultContainer}>
                        <View style={[styles.resultBadge, { backgroundColor: (status === 'correct' || status === 'completed') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }]}>
                            <Text style={[styles.resultTitle, { color: (status === 'correct' || status === 'completed') ? COLORS.primary : COLORS.error }]}>
                                {(status === 'correct' || status === 'completed') ? 'Awesome! Points Earned! 🥳' : 'Oops! Try again tomorrow.'}
                            </Text>
                        </View>
                        <Text style={styles.explanation}>{challenge.explanation}</Text>
                    </View>
                )}
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
        borderRadius: SIZES.radiusMd,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.3)',
        ...SHADOWS.medium,
    },
    gradient: {
        padding: 14,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: SIZES.fontMd,
        fontWeight: '800',
        color: COLORS.text,
        marginLeft: 8,
        flex: 1,
    },
    pointsBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: SIZES.radiusSm,
    },
    pointsText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: SIZES.fontXs,
    },
    question: {
        fontSize: SIZES.fontSm,
        color: COLORS.text,
        lineHeight: 18,
        marginBottom: 12,
    },
    optionsContainer: {
        gap: 10,
    },
    optionBtn: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 10,
        borderRadius: SIZES.radiusMd,
    },
    optionText: {
        color: COLORS.textSecondary,
        fontSize: SIZES.fontMd,
        textAlign: 'center',
    },
    primaryBtn: {
        backgroundColor: COLORS.primary,
        padding: 12,
        borderRadius: SIZES.radiusMd,
        alignItems: 'center',
    },
    primaryBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: SIZES.fontLg,
    },
    resultContainer: {
        marginTop: 10,
    },
    resultBadge: {
        padding: 12,
        borderRadius: SIZES.radiusMd,
        marginBottom: 12,
    },
    resultTitle: {
        fontWeight: '800',
        fontSize: SIZES.fontMd,
        textAlign: 'center',
    },
    explanation: {
        fontSize: SIZES.fontSm,
        color: COLORS.textSecondary,
        lineHeight: 20,
        fontStyle: 'italic',
    }
});
