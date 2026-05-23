import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, ActivityIndicator, Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ContactScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        if (!name.trim() || !email.trim() || !message.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setSending(true);
        // Simulate sending
        setTimeout(() => {
            setSending(false);
            setSubmitted(true);
            setName('');
            setEmail('');
            setMessage('');
        }, 1500);
    };

    const contactInfo = [
        { icon: 'location-outline', title: 'Our Office', value: 'B.M.S College Of Engineering', color: '#10B981' },
        { icon: 'mail-outline', title: 'Email Us', value: 'ecosharetbyu@gmail.com', color: '#3B82F6', link: 'mailto:ecosharetbyu@gmail.com' },
        { icon: 'call-outline', title: 'Call Us', value: '+91 9606343561', color: '#F59E0B', link: 'tel:+919606343561' },
    ];

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <LinearGradient colors={['#0F172A', '#1a2942']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Get in Touch</Text>
                    <Text style={styles.headerSubtitle}>
                        Have questions or suggestions? We'd love to hear from you.
                    </Text>
                </LinearGradient>

                <View style={styles.section}>
                    {submitted ? (
                        <View style={styles.successCard}>
                            <View style={styles.successIcon}>
                                <Ionicons name="checkmark-circle" size={48} color={COLORS.primary} />
                            </View>
                            <Text style={styles.successTitle}>Message Received!</Text>
                            <Text style={styles.successText}>
                                Thank you for reaching out to Voyago. Our team will get back to you within 24-48 hours.
                            </Text>
                            <TouchableOpacity style={styles.resetBtn} onPress={() => setSubmitted(false)}>
                                <Text style={styles.resetBtnText}>Send Another Message</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.formCard}>
                            <Text style={styles.formTitle}>Send a Message</Text>

                            <View style={styles.inputGroup}>
                                <Ionicons name="person-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your Name"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your Email"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={[styles.inputGroup, styles.textAreaGroup]}>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Your Message"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={message}
                                    onChangeText={setMessage}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={sending}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    style={styles.submitBtn}
                                >
                                    {sending ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.submitBtnText}>Send Message</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    {contactInfo.map((info, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.infoCard}
                            disabled={!info.link}
                            onPress={() => info.link && Linking.openURL(info.link)}
                        >
                            <View style={[styles.infoIcon, { backgroundColor: `${info.color}15` }]}>
                                <Ionicons name={info.icon} size={24} color={info.color} />
                            </View>
                            <View style={styles.infoText}>
                                <Text style={styles.infoLabel}>{info.title}</Text>
                                <Text style={styles.infoValue}>{info.value}</Text>
                            </View>
                            {info.link && <Ionicons name="open-outline" size={18} color={COLORS.textMuted} />}
                        </TouchableOpacity>
                    ))}
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
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 12,
    },
    headerSubtitle: {
        fontSize: SIZES.fontMd,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    section: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    sectionTitle: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    formCard: {
        backgroundColor: COLORS.backgroundCard,
        borderRadius: SIZES.radiusLg,
        padding: 24,
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
        ...SHADOWS.medium,
    },
    formTitle: {
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 20,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SIZES.radiusMd,
        marginBottom: 14,
    },
    inputIcon: {
        paddingHorizontal: 14,
    },
    input: {
        flex: 1,
        height: 50,
        color: COLORS.text,
        fontSize: SIZES.fontMd,
        paddingHorizontal: 12,
    },
    textAreaGroup: {
        alignItems: 'flex-start',
        paddingVertical: 10,
    },
    textArea: {
        height: 100,
    },
    submitBtn: {
        paddingVertical: 16,
        borderRadius: SIZES.radiusMd,
        alignItems: 'center',
        marginTop: 6,
    },
    submitBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: SIZES.fontLg,
    },
    successCard: {
        backgroundColor: COLORS.backgroundCard,
        borderRadius: SIZES.radiusLg,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    successIcon: {
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 12,
    },
    successText: {
        fontSize: SIZES.fontMd,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    resetBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: SIZES.radiusMd,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    resetBtnText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundCard,
        borderRadius: SIZES.radiusMd,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.glassStroke,
    },
    infoIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    infoText: {
        flex: 1,
    },
    infoLabel: {
        fontSize: SIZES.fontSm,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.text,
    },
});
