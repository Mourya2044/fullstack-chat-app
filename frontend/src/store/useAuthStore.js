import { create } from 'zustand';
import { axiosInstance } from '../lib/axios.js';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const BASE_URL = import.meta.env.MODE === "development" ? 'http://localhost:5001' : 'https://fullstack-chat-app-z1hp.onrender.com';

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get('/auth/check');
            set({authUser: res.data, })
            get().connectSocket();
        } catch (error) {
            console.log('Error checking authentication:', error);
            set({authUser: null});
        } finally {
            set({isCheckingAuth: false});
        }
    },

    signup: async (data) => {
        try {
            set({isSigningUp: true});
            const res = await axiosInstance.post('/auth/signup', data);
            set({authUser: res.data});
            toast.success('Account created successfully!');

            get().connectSocket();
        } catch (error) {
            // console.log('Error signing up:', error);
            toast.error(error.response?.data?.message || 'Failed to create account');
        } finally {
            set({isSigningUp: false});
        }
    },

    login: async (data) => {
        try {
            set({isLoggingIn: true});
            const res = await axiosInstance.post('/auth/login', data);
            set({authUser: res.data});
            toast.success('Logged in successfully!');

            get().connectSocket();
        } catch (error) {
            // console.log('Error logging in:', error);
            toast.error(error.response?.data?.message || 'Failed to log in');
        } finally {
            set({isLoggingIn: false});
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post('/auth/logout');
            set({authUser: null});
            toast.success('Logged out successfully!');
            get().disconnectSocket();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to log out');
        }
    },

    updateProfile: async (data) => {
        set({isUpdatingProfile: true});
        try {
            const res = await axiosInstance.put('/auth/update-profile', data);
            set({authUser: res.data});
            toast.success('Profile updated successfully!');
        } catch (error) {
            console.log('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            set({isUpdatingProfile: false});
        }
    },

    connectSocket: () => {
        const { authUser } = get();
        if(!authUser || get().socket?.connected ) return;

        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id 
            },
        });
        socket.connect();

        set({socket: socket});
        socket.on("getOnlineUsers", (userIds) => {
            set({onlineUsers: userIds});
        });
    },

    disconnectSocket: () => {
        if (get().socket) get().socket.disconnect();
    },
}));