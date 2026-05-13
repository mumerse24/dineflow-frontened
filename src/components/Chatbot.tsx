import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<{ sender: "user" | "bot"; text: string }[]>([
    { sender: "bot", text: "Hi there! 👋 I'm your AI food assistant. What are you craving today?" }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat, isLoading]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setChat((prev) => [...prev, { sender: "user", text: userMessage }]);
    setMessage("");
    setIsLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: chat }),
      });

      const data = await res.json();

      if (data.reply) {
        setChat((prev) => [...prev, { sender: "bot", text: data.reply }]);
      } else {
        setChat((prev) => [
          ...prev,
          { sender: "bot", text: "Oops, something went wrong on my end! 😢" },
        ]);
      }
    } catch (error) {
      setChat((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, I couldn't reach the server right now." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 flex flex-col w-[350px] sm:w-[400px] h-[500px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Taste AI Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                title="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4" style={{ backgroundColor: "var(--background)" }}>
              {chat.map((c, i) => (
                <div
                  key={i}
                  className={`flex ${c.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl flex gap-2 ${
                      c.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-none"
                    }`}
                  >
                    <span className="text-sm shadow-sm">{c.text}</span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 rounded-bl-none">
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask for food recommendations..."
                className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground dark:text-zinc-200 transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !message.trim()}
                className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-primary/50 hover:bg-primary/90 transition-all flex items-center justify-center"
        aria-label="Toggle Chat"
      >
        <MessageCircle className={`w-7 h-7 transition-transform duration-300 ${isOpen ? "hidden" : "block"}`} />
        <X className={`w-7 h-7 transition-transform duration-300 ${isOpen ? "block" : "hidden"}`} />
      </motion.button>
    </div>
  );
}

export default Chatbot;
