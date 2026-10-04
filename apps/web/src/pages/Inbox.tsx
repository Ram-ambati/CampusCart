import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatSession, ChatMessage } from '@campuscart/types';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function Inbox() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  const activeSessionId = searchParams.get('session');
  const messageToSend = searchParams.get('send');
  const [inputMessage, setInputMessage] = useState('');
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('jwt');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // 1. Fetch all sessions
  const { data: sessions = [], isLoading: loadingSessions } = useQuery<ChatSession[]>({
    queryKey: ['chatSessions'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch sessions');
      return res.json();
    },
    refetchInterval: 10000 // Poll sessions every 10s just in case
  });

  // 2. Fetch messages for active session
  const { data: messages = [], isLoading: loadingMessages } = useQuery<ChatMessage[]>({
    queryKey: ['chatMessages', activeSessionId],
    queryFn: async () => {
      if (!activeSessionId) return [];
      const res = await fetch(`${API_URL}/api/chat/session/${activeSessionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!activeSessionId,
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Setup WebSocket connection
  useEffect(() => {
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        console.log('Connected to STOMP');
        // If we have an active session, subscribe to it
        if (activeSessionId) {
          client.subscribe(`/topic/session/${activeSessionId}`, (message) => {
            const newMsg = JSON.parse(message.body);
            // Append to React Query cache to instantly update UI
            queryClient.setQueryData<ChatMessage[]>(['chatMessages', activeSessionId], (old) => {
              return old ? [...old, newMsg] : [newMsg];
            });
            // Also invalidate sessions list to update "last active" sorting if needed
            queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
          });

          // If we came from ItemDetail with a message to send, send it automatically
          if (messageToSend) {
            client.publish({
              destination: '/app/chat',
              body: JSON.stringify({
                sessionId: Number(activeSessionId),
                content: messageToSend,
              }),
            });
            // Clean up the URL by removing the 'send' parameter
            searchParams.delete('send');
            setSearchParams(searchParams, { replace: true });
          }
        }
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
      }
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [activeSessionId, token, queryClient, messageToSend, searchParams, setSearchParams]);

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeSessionId || !stompClient?.connected) return;

    try {
      stompClient.publish({
        destination: '/app/chat',
        body: JSON.stringify({
          sessionId: Number(activeSessionId),
          content: inputMessage.trim(),
        }),
      });
      setInputMessage('');
    } catch (err) {
      alert("Failed to send message: " + (err as Error).message);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar: Sessions List */}
      <div className="w-1/3 bg-white border-r border-slate-200 flex flex-col h-full z-10">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900">Inbox</h2>
          <button onClick={() => navigate('/marketplace')} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loadingSessions ? (
            <div className="p-4 text-center text-slate-400">Loading chats...</div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-medium">No conversations yet.</div>
          ) : (
            sessions.map((session) => {
              const otherUser = session.buyer.id === currentUser.id ? session.seller : session.buyer;
              const isActive = session.id.toString() === activeSessionId;
              
              return (
                <div 
                  key={session.id} 
                  onClick={() => setSearchParams({ session: session.id.toString() })}
                  className={`p-4 border-b border-slate-100 cursor-pointer transition-colors flex gap-4 items-center ${isActive ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50'}`}
                >
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {otherUser.avatarUrl ? (
                      <img src={otherUser.avatarUrl} alt={otherUser.preferredName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-500 font-bold text-lg">{otherUser.preferredName?.charAt(0) || otherUser.realName.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-slate-900 truncate">{otherUser.preferredName || otherUser.realName}</h3>
                    </div>
                    <p className="text-sm text-slate-500 truncate">{session.listing.title}</p>
                  </div>
                  {session.listing.images?.[0] && (
                    <img 
                      src={session.listing.images[0].imageUrl} 
                      alt="Item" 
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-slate-200" 
                      onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100/e2e8f0/475569?text=No+Image'; }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Area: Active Chat */}
      <div className="flex-1 flex flex-col h-full bg-slate-50">
        {!activeSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p className="text-lg font-medium">Select a conversation to start messaging</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-slate-200 bg-white flex items-center px-6 shadow-sm z-10 shrink-0">
              {sessions.find(s => s.id.toString() === activeSessionId) && (
                <div className="flex items-center gap-4">
                  <div className="font-bold text-slate-900">
                    {sessions.find(s => s.id.toString() === activeSessionId)?.listing.title}
                  </div>
                  <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-md font-medium">
                    ₹{sessions.find(s => s.id.toString() === activeSessionId)?.listing.price}
                  </span>
                </div>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages ? (
                <div className="text-center text-slate-400">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-400 font-medium my-10">
                  No messages yet. Send a message to start negotiating!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender.id === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-5 py-3 rounded-2xl ${isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'}`}>
                        <p className="text-[15px] leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-100 border-none rounded-full px-6 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
                />
                <button 
                  type="submit" 
                  disabled={!inputMessage.trim()}
                  className="bg-indigo-600 text-white rounded-full p-3 w-12 h-12 flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md"
                >
                  <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
