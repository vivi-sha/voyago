import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext();

// Configure your API URL here:
// Production (Your new Voyago Vercel URL):
const PRODUCTION_URL = 'https://voyago-chi.vercel.app/api';

// Local development:
const LOCAL_URL = 'http://192.168.31.52:5000/api';

const getApiUrl = () => {
    return PRODUCTION_URL;
};

const API_URL = getApiUrl();

export const AuthProvider = ({ children }) => {
    const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
    const { signOut, getToken } = useClerkAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchWithAuth = async (url, options = {}) => {
        const token = await getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
        return fetch(url, { ...options, headers });
    };

    useEffect(() => {
        if (clerkLoaded) {
            if (clerkUser) {
                // Try to load cached user first for instant UI
                SecureStore.getItemAsync('cachedUser').then(cached => {
                    if (cached) {
                        try {
                            setUser(JSON.parse(cached));
                            setLoading(false); // Unblock the UI instantly!
                        } catch (e) {
                            console.error('Failed to parse cached user', e);
                        }
                    }
                    // Sync with your backend in the background
                    syncUserWithBackend(clerkUser, !cached);
                });
            } else {
                setUser(null);
                setLoading(false);
            }
        }
    }, [clerkUser, clerkLoaded]);

    const syncUserWithBackend = async (cUser, updateLoadingState = true) => {
        try {
            console.log(`Syncing with ${API_URL}/auth/google...`);
            const res = await fetchWithAuth(`${API_URL}/auth/google`, {
                method: 'POST',
                body: JSON.stringify({
                    clerkId: cUser.id,
                    name: cUser.fullName || cUser.username || cUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User',
                    email: cUser.primaryEmailAddress?.emailAddress,
                    photoUrl: cUser.imageUrl,
                }),
            });

            console.log(`Backend response: ${res.status}`);
            
            if (res.ok) {
                const text = await res.text();
                if (text) {
                    const data = JSON.parse(text);
                    setUser(data);
                    SecureStore.setItemAsync('cachedUser', text).catch(console.error);
                    
                    // Check if there was a pending trip join from a deep link
                    const pendingCode = await SecureStore.getItemAsync('pendingJoinCode');
                    if (pendingCode) {
                        try {
                            const joinRes = await fetchWithAuth(`${API_URL}/trips/join`, {
                                method: 'POST',
                                body: JSON.stringify({ shareCode: pendingCode, userId: data._id || data.id })
                            });
                            if (joinRes.ok) {
                                alert('Success! You have been added to the trip!');
                            }
                            await SecureStore.deleteItemAsync('pendingJoinCode');
                        } catch (e) {
                            console.error('Pending join failed', e);
                        }
                    }
                }
            } else {
                const errorText = await res.text();
                console.error(`Backend error (${res.status}):`, errorText);
                throw new Error(`Backend error ${res.status}`);
            }
        } catch (e) {
            console.error('Error syncing with backend:', e.message);
            // Don't block the user from using the app if backend is down
            // Set a minimal user object from Clerk data
            setUser({
                _id: cUser.id,
                clerkId: cUser.id,
                name: cUser.fullName || cUser.username || 'User',
                email: cUser.primaryEmailAddress?.emailAddress,
                photoUrl: cUser.imageUrl,
                ecoPoints: 0,
                donatedPoints: 0,
            });
        } finally {
            if (updateLoadingState) {
                setLoading(false);
            }
        }
    };

    const logout = async () => {
        try {
            await signOut();
            setUser(null);
            await SecureStore.deleteItemAsync('cachedUser');
        } catch (e) {
            console.error('Logout failed:', e);
        }
    };

    const refreshUser = async () => {
        if (!user?._id && !user?.id) return;
        try {
            const userId = user._id || user.id;
            const res = await fetchWithAuth(`${API_URL}/users/${userId}`);
            if (res.ok) {
                const updatedUser = await res.json();
                setUser(updatedUser);
            }
        } catch (e) {
            console.error('Failed to refresh user:', e);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            logout,
            refreshUser,
            fetchWithAuth,
            loading: !clerkLoaded || loading,
            API_URL,
            clerkUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export { API_URL };
