import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export default function MotivationalQuoteCard() {
  const [quote, setQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQuote = async (forceRefresh = false) => {
    try {
      setIsRefreshing(forceRefresh);
      if (!forceRefresh) setIsLoading(true);

      const { data } = await base44.functions.invoke('getMotivationalQuote');
      
      const quoteData = {
        text: data.text,
        author: data.author,
        date: format(new Date(), 'yyyy-MM-dd')
      };

      // Store in localStorage with today's date
      localStorage.setItem('dailyQuote', JSON.stringify(quoteData));
      setQuote(quoteData);
    } catch (error) {
      console.error('Error fetching quote:', error);
      // Set fallback quote
      setQuote({
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        date: format(new Date(), 'yyyy-MM-dd')
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const loadQuote = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const cached = localStorage.getItem('dailyQuote');

      if (cached) {
        const cachedQuote = JSON.parse(cached);
        // Check if cached quote is from today
        if (cachedQuote.date === today) {
          setQuote(cachedQuote);
          setIsLoading(false);
          return;
        }
      }

      // No cached quote or it's from a different day - fetch new one
      await fetchQuote();
    };

    loadQuote();
  }, []);

  if (isLoading) {
    return (
      <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-center py-8">
          <div className="inline-block w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white/70" />
            <h3 className="text-lg font-light text-white/90">Daily Inspiration</h3>
          </div>
          <button
            onClick={() => fetchQuote(true)}
            disabled={isRefreshing}
            className="glass p-2 rounded-xl hover:glass-strong transition-all duration-300 disabled:opacity-50"
            title="Get new quote"
          >
            <RefreshCw className={`w-4 h-4 text-white/70 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {quote && (
          <div className="space-y-4">
            <blockquote className="text-white text-xl md:text-2xl font-light leading-relaxed italic">
              "{quote.text}"
            </blockquote>
            <p className="text-white/70 text-sm md:text-base font-light text-right">
              — {quote.author}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}