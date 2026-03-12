"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { format } from "date-fns";
import { Send, Upload, Paperclip, Loader2, MessageSquare, PlusCircle, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChatSession,
  ChatMessage,
  createChatSession,
  getChatSessions,
  getChatHistory,
  uploadDocument,
  sendChatMessage,
  deleteChatSession
} from "@/lib/api";

export default function AssistantPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial Bootup
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const resp = await getChatSessions();
      setSessions(resp);
      if (resp.length > 0 && !activeSession) {
        loadSession(resp[0].id);
      } else if (resp.length === 0) {
        handleNewChat();
      }
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const session = await getChatHistory(sessionId);
      setActiveSession(session);
      setMessages(session.messages);
      setUploadSuccess(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewChat = async () => {
    try {
      const s = await createChatSession({ session_title: "New Conversation" });
      setSessions([s, ...sessions]);
      setActiveSession(s);
      setMessages([]);
      setUploadSuccess(false);
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputVal.trim() || !activeSession) return;
    
    const userMsg: ChatMessage = {
      session_id: activeSession.id,
      role: "user",
      message: inputVal
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setInputVal("");

    try {
      const res = await sendChatMessage({
        session_id: activeSession.id,
        message: userMsg.message
      });
      
      const asstMsg: ChatMessage = {
        session_id: activeSession.id,
        role: "assistant",
        message: res.answer
      };
      
      setMessages(prev => [...prev, asstMsg]);
      
      // Auto refresh session list in case title was updated
      if (messages.length <= 2) {
        fetchSessions();
      }
      
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        session_id: activeSession.id,
        role: "system",
        message: "Network error reaching the AI agent."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeSession) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    setUploadSuccess(false);
    try {
      await uploadDocument(activeSession.id, file);
      setUploadSuccess(true);
      // Auto-inject a system message reflecting the successful upload
      setMessages(prev => [...prev, {
        session_id: activeSession.id,
        role: 'system',
        message: `System: "${file.name}" uploaded successfully. I have extracted its contents. You can now ask questions about it, or type "Summarize this manifesto".`
      }]);
    } catch (err) {
      console.error(err);
      alert("Failed to upload document.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await deleteChatSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
        setMessages([]);
        fetchSessions(); // Fetch the latest to fall back to the next available session
      }
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 flex-col md:flex-row">
      {/* Sidebar - History */}
      <div className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0 shadow-sm z-10">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="font-semibold text-gray-700">Chat History</h2>
          <button 
            onClick={handleNewChat}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="New Chat"
          >
            <PlusCircle size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.map(s => (
            <div 
              key={s.id} 
              onClick={() => loadSession(s.id)}
              className={`group p-3 rounded-lg cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                activeSession?.id === s.id ? 'bg-blue-50 border border-blue-100 text-blue-800' : 'hover:bg-gray-100 text-gray-600 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} className={activeSession?.id === s.id ? "text-blue-500 shrink-0" : "text-gray-400 shrink-0"} />
                <div className="truncate text-sm font-medium">
                  {s.session_title}
                </div>
              </div>
              <button 
                onClick={(e) => handleDeleteSession(e, s.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-all shrink-0"
                title="Delete Chat"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No recent conversations.</p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between bg-white z-10 shadow-sm">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            {activeSession ? activeSession.session_title : "Governance AI Agent"}
          </h1>
          {isUploading && <span className="text-sm text-blue-600 animate-pulse flex items-center gap-2"><Loader2 size={14} className="animate-spin"/> Parsing Document...</span>}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-gray-50">
          {messages.length === 0 && !isTyping && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <MessageSquare size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">How can I help you today?</h2>
              <p className="text-gray-500 max-w-md">
                I am your unified governance assistant. Ask about policies, budgets, or <strong className="text-blue-600">upload a manifesto document</strong> below to analyze it visually with RAG intelligence.
              </p>
            </div>
          )}

          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : m.role === 'system'
                    ? 'bg-green-50 text-green-800 border border-green-200 text-sm font-medium mx-auto text-center shadow-none'
                    : 'bg-white text-gray-800 rounded-bl-none border border-gray-100 leading-relaxed'
                }`}
              >
                {m.role === 'user' || m.role === 'system' ? (
                  <div className="whitespace-pre-wrap">{m.message}</div>
                ) : (
                  <div className="prose prose-sm md:prose-base max-w-none text-gray-800 prose-p:leading-relaxed prose-a:text-blue-600 prose-strong:text-gray-900">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.message}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-75"></span>
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse delay-150"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Dock */}
        <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-4xl mx-auto flex gap-3 items-center">
            
            {/* Attachment Button */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={!activeSession || isUploading}
              className={`p-3 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                uploadSuccess ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } disabled:opacity-50`}
              title="Upload Manifesto Document"
            >
              <Paperclip size={20} />
            </button>

            {/* Text Input */}
            <input 
              type="text" 
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping || !activeSession}
              placeholder={activeSession ? "Ask about policies, or type 'Summarize manifesto'..." : "Starting session..."}
              className="flex-1 bg-gray-50 border border-gray-300 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
            />
            
            {/* Send Button */}
            <button 
              onClick={handleSend}
              disabled={!inputVal.trim() || isTyping || !activeSession}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-md"
            >
              <Send size={20} />
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
}
