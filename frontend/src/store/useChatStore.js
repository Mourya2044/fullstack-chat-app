import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,


    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/users");
            set({ users: res.data });
            Notification.requestPermission().then((result) => {
                console.log(result);
            });

        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch users");
            console.error("Error fetching users:", error);
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            set({ messages: [...messages, res.data] });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send message");
            console.error("Error sending message:", error);
        }
    },

    subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;
        const currentUser = useAuthStore.getState().user;

        if (!socket) return;

        socket.off("newMessage");

        socket.on("newMessage", (newMessage) => {
            const { selectedUser, messages } = get();

            const isFromSelectedUser = selectedUser && newMessage.senderId === selectedUser._id;
            const isFromSelf = currentUser && currentUser._id === newMessage.senderId;

            if (isFromSelectedUser) {
                set({ messages: [...messages, newMessage] });
            }

            if (!isFromSelf && (!isFromSelectedUser || document.hidden)) {
                new Notification("New Message", {
                    body: newMessage.text,
                    icon: "/chat-icon.png",
                });
            }
        });
    },


    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
    },

    setSelectedUser: (selectedUser) => set({ selectedUser })
}));