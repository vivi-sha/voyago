import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-expo';

const AuthContext = createContext();

// Configure your API URL here:
// Production (Vercel deployment):
const PRODUCTION_URL = 'https://ecoshare-eight.vercel.app/api';

// Local development - uncomment and set your machine's local IP to use the local backend:
// const LOCAL_IP = '10.75.86.148';
// const LOCAL_URL = `http://${LOCAL_IP}:5000/api`;

const getApiUrl = () => {
    // Use local backend for Expo development
    return `http://192.168.31.52:5000/api`;
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
                // Sync with your backend
                syncUserWithBackend(clerkUser);
            } else {
                setUser(null);
                setLoading(false);
            }
        }
    }, [clerkUser, clerkLoaded]);

    const syncUserWithBackend = async (cUser) => {
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
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await signOut();
            setUser(null);
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
