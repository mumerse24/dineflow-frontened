import React, { useState, useEffect, useRef } from "react";
import { Send, X, User, Bike } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import socketService from "@/services/socket";

interface Message {
    _id: string;
    sender: {
        _id: string;
        name: string;
        role: string;
    };
    text: string;
    createdAt: string;
}

interface ChatWindowProps {
    orderId: string;
    userId: string;
    userName: string;
    userRole: string;
    onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ orderId, userId, userName, userRole, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // 1. Fetch History
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/messages/${orderId}`);
                if (res.data.success) {
                    setMessages(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch chat history:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();

        // 2. Socket Join
        const socket = socketService.getSocket();
        if (socket) {
            socket.emit("joinOrderChat", orderId);

            socket.on("newMessage", (message: Message) => {
                setMessages(prev => [...prev, message]);
            });
        }

        return () => {
            socket?.off("newMessage");
        };
    }, [orderId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const socket = socketService.getSocket();
        if (socket) {
            socket.emit("sendMessage", {
                orderId,
                senderId: userId,
                text: inputText
            });
            setInputText("");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 h-[450px] bg-white border border-gray-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[60]"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        {userRole === 'rider' ? <User className="w-5 h-5 text-white" /> : <Bike className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">
                            Chat with {userRole === 'rider' ? 'Customer' : 'Rider'}
                        </h3>
                        <p className="text-orange-100/70 text-[10px]">Order #{orderId.slice(-8)}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 text-white/70 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/50">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-gray-300 text-xs italic">No messages yet. Say hello!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg._id}
                            className={`flex flex-col ${msg.sender && (msg.sender._id === userId || (msg.sender as any).id === userId) ? "items-end" : "items-start"}`}
                        >
                            <div
                                className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender && (msg.sender._id === userId || (msg.sender as any).id === userId)
                                        ? "bg-orange-500 text-white rounded-tr-none shadow-sm shadow-orange-500/20"
                                        : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                                    }`}
                            >
                                {msg.text}
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 px-1">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500/50 transition-colors"
                />
                <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-orange-500/20"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </motion.div>
    );
};

export default ChatWindow;
