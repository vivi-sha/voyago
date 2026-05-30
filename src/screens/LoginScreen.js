import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useSignIn, useSignUp, useOAuth } from '@clerk/clerk-expo';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
    useWarmUpBrowser();
    const insets = useSafeAreaInsets();
    const { API_URL, fetchWithAuth } = useAuth();
    const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn();
    const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

    const [isSignup, setIsSignup] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');

    const onGooglePress = useCallback(async () => {
        setGoogleLoading(true);
        try {
            const { createdSessionId, setActive } = await startOAuthFlow({
                redirectUrl: Linking.createURL('/dashboard', { scheme: 'voyago' }),
            });
            if (createdSessionId) {
                setActive({ session: createdSessionId });
                // Return here so we DO NOT turn off the loading spinner!
                return;
            }
        } catch (err) {
            console.error(JSON.stringify(err, null, 2));
            if (err.errors?.[0]?.code === 'session_exists') {
                Alert.alert(
                    'Already Signed In', 
                    'You already have an active session! The app just needs a quick restart to sync your data. Please close the Expo Go app completely from your recent apps and open it again.'
                );
            } else {
                Alert.alert('Google Auth Error', 'Could not complete Google sign in.');
            }
        }
        setGoogleLoading(false);
    }, [startOAuthFlow]);

    const onSignInPress = useCallback(async () => {
        if (!signInLoaded) return;
        setLoading(true);
        try {
            const completeSignIn = await signIn.create({
                identifier: email,
                password,
            });
            await setSignInActive({ session: completeSignIn.createdSessionId });
            // Return here so we DO NOT turn off the loading spinner!
            return;
        } catch (err) {
            console.error(JSON.stringify(err, null, 2));
            Alert.alert('Login Error', err.errors ? err.errors[0].message : 'Internal error');
        }
        setLoading(false);
    }, [signInLoaded, email, password]);

    const onSignUpPress = useCallback(async () => {
        if (!signUpLoaded) return;
        setLoading(true);
        try {
            await signUp.create({
                emailAddress: email,
                password,
                firstName: name.split(' ')[0],
                lastName: name.split(' ').slice(1).join(' '),
            });
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            setPendingVerification(true);
        } catch (err) {
            console.error(JSON.stringify(err, null, 2));
            Alert.alert('Signup Error', err.errors ? err.errors[0].message : 'Internal error');
        } finally {
            setLoading(false);
        }
    }, [signUpLoaded, name, email, password]);

    const onVerifyPress = useCallback(async () => {
        if (!signUpLoaded) return;
        setLoading(true);
        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });
            if (completeSignUp.status === 'complete') {
                await setSignUpActive({ session: completeSignUp.createdSessionId });
                // Return here so we DO NOT turn off the loading spinner!
                return;
            } else {
                console.log(JSON.stringify(completeSignUp, null, 2));
            }
        } catch (err) {
            console.error(JSON.stringify(err, null, 2));
            Alert.alert('Verification Error', err.errors ? err.errors[0].message : 'Internal error');
        }
        setLoading(false);
    }, [signUpLoaded, code, setSignUpActive]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.logoMark}>
                        <View style={styles.logoCircle}>
                            <Text style={{ fontSize: 36 }}>🌿</Text>
                        </View>
                        <Text style={styles.logoText}>Voyago</Text>
                    </View>

                    <Text style={styles.title}>
                        {isSignup ? 'Create Account' : 'Welcome Back'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {isSignup ? 'Join the eco-travel revolution' : 'Sign in to sync your travel data'}
                    </Text>

                    {/* Social Login */}
                    <TouchableOpacity
                        style={styles.googleBtn}
                        onPress={onGooglePress}
                        disabled={googleLoading}
                    >
                        {googleLoading ? (
                            <ActivityIndicator color="#333" />
                        ) : (
                            <>
                                <FontAwesome name="google" size={20} color="#DB4437" style={{ marginRight: 12 }} />
                                <Text style={styles.googleBtnText}>Continue with Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.form}>
                        {pendingVerification ? (
                            <>
                                <Text style={[styles.subtitle, { color: COLORS.primary, marginBottom: 16 }]}>
                                    Enter the verification code sent to your email.
                                </Text>
                                <View style={styles.inputGroup}>
                                    <Ionicons name="key-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Verification Code"
                                        placeholderTextColor={COLORS.textMuted}
                                        value={code}
                                        onChangeText={setCode}
                                        keyboardType="number-pad"
                                    />
                                </View>
                                <TouchableOpacity
                                    style={styles.submitBtn}
                                    onPress={onVerifyPress}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#10B981', '#059669']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.submitBtnGradient}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.submitBtnText}>
                                                Verify Email
                                            </Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ marginTop: 16, alignItems: 'center' }}
                                    onPress={() => setPendingVerification(false)}
                                >
                                    <Text style={styles.switchLink}>Back to Sign Up</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                {isSignup && (
                            <View style={styles.inputGroup}>
                                <Ionicons name="person-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email Address"
                                placeholderTextColor={COLORS.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor={COLORS.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={isSignup ? onSignUpPress : onSignInPress}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#10B981', '#059669']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitBtnGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitBtnText}>
                                        {isSignup ? 'Create Account' : 'Login'}
                                    </Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                                <View style={styles.switchContainer}>
                                    <Text style={styles.switchText}>
                                        {isSignup ? 'Already have an account?' : "Don't have an account?"}
                                    </Text>
                                    <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
                                        <Text style={styles.switchLink}>
                                            {isSignup ? ' Login' : ' Sign Up'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingTop: 16,
        paddingHorizontal: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    logoMark: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(16,185,129,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    logoText: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.primary,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: SIZES.fontMd,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
    },
    googleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        height: 54,
        borderRadius: SIZES.radiusMd,
        marginBottom: 24,
        ...SHADOWS.medium,
    },
    googleBtnText: {
        color: '#000',
        fontSize: SIZES.fontMd,
        fontWeight: '700',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        paddingHorizontal: 16,
        color: COLORS.textMuted,
        fontSize: SIZES.fontSm,
        fontWeight: '600',
    },
    form: {
        gap: 16,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SIZES.radiusMd,
    },
    inputIcon: {
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        height: 54,
        color: COLORS.text,
        fontSize: SIZES.fontMd,
    },
    eyeIcon: {
        paddingHorizontal: 16,
    },
    submitBtn: {
        marginTop: 8,
        borderRadius: SIZES.radiusMd,
        ...SHADOWS.glow,
    },
    submitBtnGradient: {
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: SIZES.radiusMd,
    },
    submitBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: SIZES.fontLg,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    switchText: {
        color: COLORS.textSecondary,
        fontSize: SIZES.fontMd,
    },
    switchLink: {
        color: COLORS.primary,
        fontSize: SIZES.fontMd,
        fontWeight: '700',
    },

});
