import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Send, X, RotateCcw, Bot, Utensils, Plus, Check, Clock, ShoppingBag, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

export default function AiAssistantDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Extract restaurant ID if currently viewing a restaurant details page
  const restMatch = location.pathname.match(/\/app\/restaurants\/(\d+)/);
  const currentRestaurantId = restMatch ? restMatch[1] : null;

  // Track previous restaurant ID to reset chat when switching restaurants
  const prevRestaurantIdRef = useRef(currentRestaurantId);

  const [messages, setMessages] = useState(() => [
    getInitialGreeting(currentRestaurantId)
  ]);

  function getInitialGreeting(restId) {
    if (restId) {
      return {
        role: 'assistant',
        content: `👋 **Welcome to this restaurant!**\n\nI am your live Smart Table AI Dining Assistant. I can recommend dishes from our current menu, check table availability, filter by diet (Pure Veg, Non-Veg, Spicy), or suggest dishes within your budget.\n\nWhat would you like to explore?`,
        suggestedRestaurants: [],
        recommendedItems: [],
        restaurantId: restId
      };
    }
    return {
      role: 'assistant',
      content: `👋 **Hello! I'm your Smart Table AI Dining Concierge.**\n\nI can recommend restaurants across Chennai, check live table seating, accommodate dietary restrictions, or help you find your next great meal. How can I help you dine today?`,
      suggestedRestaurants: [],
      recommendedItems: [],
      restaurantId: null
    };
  }

  // When restaurant switches, update conversation context cleanly
  useEffect(() => {
    if (prevRestaurantIdRef.current !== currentRestaurantId) {
      prevRestaurantIdRef.current = currentRestaurantId;
      setMessages([getInitialGreeting(currentRestaurantId)]);
    }
  }, [currentRestaurantId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Contextual Quick Prompts
  const quickPrompts = currentRestaurantId ? [
    { label: '🌱 Pure Veg', text: 'I am vegetarian, recommend the best dishes' },
    { label: '💰 Under ₹300', text: 'What can I get under 300?' },
    { label: '🌶️ Spicy Bites', text: 'Recommend something flavorful and spicy' },
    { label: '🍽️ For 2 Guests', text: 'What is good for two people?' },
    { label: '⚡ Quick Prep', text: 'Which dishes have the fastest preparation time?' },
    { label: '⭐ Top Specials', text: 'What should I order?' },
  ] : [
    { label: '🦐 Seafood', text: 'Recommend a top seafood restaurant with available tables right now' },
    { label: '🥗 Pure Veg', text: 'Where can I find pure vegetarian dining with quick seating?' },
    { label: '🍜 Japanese', text: 'Recommend an authentic Japanese ramen and sushi spot' },
    { label: '🍕 Pizza & Pasta', text: 'Suggest a good artisanal cafe with wood-fired pizzas' },
    { label: '⚡ Fast Seating', text: 'Which restaurant has the lowest wait time and open tables?' },
  ];

  const handleSend = async (userText = null) => {
    const textToSend = userText || input.trim();
    if (!textToSend || loading) return;

    const newMessages = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Get browser coordinates if available
      let coords = null;
      if (navigator.geolocation) {
        coords = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 3000 }
          );
        });
      }

      const res = await api.post('/ai/assistant', {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        location: coords,
        restaurantId: currentRestaurantId
      });

      if (res.data?.success && res.data?.data) {
        const data = res.data.data;

        // Auto add-to-cart if intent was detected by AI backend
        if (data.action?.type === 'add_to_cart' && data.action.item) {
          const targetItem = data.action.item;
          const restObj = data.restaurant || { id: Number(currentRestaurantId) };
          addToCart(targetItem, restObj);
          toast.success(`🛒 Added ${targetItem.name} to cart!`);
        }

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply,
            restaurant: data.restaurant,
            recommendedItems: data.recommendedItems || [],
            suggestedRestaurants: data.suggestedRestaurants || [],
            source: data.source
          }
        ]);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error('[AI Assistant UI] Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ I had trouble connecting to the dining engine. Please ask again or browse the menu directly.',
          suggestedRestaurants: [],
          recommendedItems: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([getInitialGreeting(currentRestaurantId)]);
  };

  const handleAddToCartItem = (item, restaurant) => {
    const restTarget = restaurant || { id: Number(currentRestaurantId) };
    addToCart(item, restTarget);
    toast.success(`Added ${item.name} to cart!`, {
      icon: '🛒',
      style: { background: '#1A1E2E', color: '#00C2A8' }
    });
  };

  return (
    <>
      {/* Floating Concierge Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full
                     bg-gradient-to-r from-brand to-emerald-500 text-surface-bg font-semibold text-xs
                     shadow-lg hover:shadow-brand/40 hover:scale-105 active:scale-95 transition-all
                     border border-brand/40 group"
          aria-label="Open AI Concierge"
        >
          <Sparkles size={16} className="animate-spin text-surface-bg" style={{ animationDuration: '4s' }} />
          <span>AI Concierge</span>
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        </button>
      )}

      {/* Expanded Chat Drawer / Card */}
      {isOpen && (
        <div className="fixed bottom-20 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[420px] h-[550px] max-h-[82vh]
                        bg-surface-card border border-surface-border rounded-2xl shadow-2xl flex flex-col
                        overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="px-4 py-3 bg-surface-elevated border-b border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand to-emerald-500 flex items-center justify-center text-surface-bg shadow-sm">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-text-primary">Smart Table AI</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand/10 text-brand font-medium">
                    {currentRestaurantId ? 'Restaurant Assistant' : 'Concierge'}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Menu & Table Grounded
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                title="Reset conversation"
                className="w-7 h-7 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-card flex items-center justify-center transition-colors"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="w-7 h-7 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-card flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-2 bg-surface-bg border-b border-surface-border flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.text)}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] bg-surface-card hover:bg-surface-elevated
                           border border-surface-border text-text-secondary hover:text-brand hover:border-brand/40
                           transition-all disabled:opacity-50 flex-shrink-0"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-surface-bg/50">
            {messages.map((m, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-brand flex-shrink-0 mt-0.5">
                    <Bot size={13} />
                  </div>
                )}

                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-brand text-surface-bg rounded-br-none shadow-sm'
                    : 'bg-surface-card text-text-primary border border-surface-border rounded-bl-none shadow-sm'
                }`}>
                  <div className="whitespace-pre-line font-sans">
                    {m.content}
                  </div>

                  {/* Grounded Recommended Menu Items Cards */}
                  {m.recommendedItems && m.recommendedItems.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-surface-border/60 space-y-2">
                      <p className="text-[10px] font-bold text-brand uppercase tracking-wider flex items-center gap-1">
                        <Utensils size={11} />
                        <span>Recommended from Live Menu</span>
                      </p>
                      {m.recommendedItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 rounded-xl bg-surface-elevated/90 border border-surface-border hover:border-brand/40 transition-all flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                  item.is_vegetarian ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                                title={item.is_vegetarian ? 'Veg' : 'Non-Veg'}
                              />
                              <p className="text-xs font-bold text-text-primary truncate">
                                {item.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-text-muted">
                              <span className="font-semibold text-brand">₹{Number(item.price).toFixed(2)}</span>
                              {item.preparation_time_mins && (
                                <span className="flex items-center gap-0.5">
                                  <Clock size={10} />
                                  {item.preparation_time_mins}m
                                </span>
                              )}
                              {item.category_name && (
                                <span className="truncate max-w-[90px]">{item.category_name}</span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddToCartItem(item, m.restaurant)}
                            className="px-2.5 py-1 rounded-lg bg-brand/10 hover:bg-brand text-brand hover:text-surface-bg
                                       text-[11px] font-bold border border-brand/30 transition-all shrink-0 flex items-center gap-1 shadow-sm active:scale-95"
                            title="Add item to pre-order cart"
                          >
                            <Plus size={11} />
                            <span>Add</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggested Restaurant Action Cards (When exploring across Smart Table AI) */}
                  {m.suggestedRestaurants && m.suggestedRestaurants.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-surface-border/60 space-y-1.5">
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Suggested Dining Spots</p>
                      {m.suggestedRestaurants.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => {
                            setIsOpen(false);
                            navigate(`/app/restaurants/${r.id}`);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl bg-surface-elevated/80 hover:bg-surface-elevated
                                     border border-surface-border hover:border-brand/40 cursor-pointer transition-all group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-text-primary group-hover:text-brand transition-colors truncate">
                              {r.name}
                            </p>
                            <p className="text-[10px] text-text-muted truncate">
                              {r.cuisine} • {r.availableTables !== undefined ? `${r.availableTables} tables open` : 'Floor plan active'}
                            </p>
                          </div>
                          <ChevronRight size={14} className="text-text-muted group-hover:text-brand transition-transform group-hover:translate-x-0.5" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-text-muted text-xs">
                <div className="w-6 h-6 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-brand">
                  <Bot size={13} />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-surface-card border border-surface-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[11px] text-text-muted ml-1">Searching live menu...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-surface-elevated border-t border-surface-border flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentRestaurantId ? "Ask for recommendations, veg, spicy, budget..." : "Ask about restaurants, cuisines, tables..."}
              disabled={loading}
              className="flex-1 bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs
                         text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand
                         transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl bg-brand text-surface-bg flex items-center justify-center
                         hover:bg-brand/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all shadow-sm"
              aria-label="Send Message"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
