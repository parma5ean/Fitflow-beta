
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Dumbbell, TrendingUp, Utensils, User, LogOut, Sparkles, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ActiveWorkoutBar from "@/components/dashboard/ActiveWorkoutBar";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isWorkoutMode, setIsWorkoutMode] = useState(false);

  // Detect workout mode
  useEffect(() => {
    const checkWorkoutMode = () => {
      const workoutMode = document.body.getAttribute('data-workout-mode') === 'true';
      setIsWorkoutMode(workoutMode);
    };

    checkWorkoutMode();
    
    // Watch for changes
    const observer = new MutationObserver(checkWorkoutMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-workout-mode'] });

    return () => observer.disconnect();
  }, []);

  const navigationItems = [
    {
      title: "Dashboard",
      url: createPageUrl("Dashboard"),
      icon: LayoutDashboard
    },
    {
      title: "AI Trainer",
      url: createPageUrl("AITrainer"),
      icon: Sparkles
    },
    {
      title: "Programs",
      url: createPageUrl("Programs"),
      icon: Calendar
    },
    {
      title: "Progress",
      url: createPageUrl("Progress"),
      icon: TrendingUp
    },
    {
      title: "Nutrition",
      url: createPageUrl("Nutrition"),
      icon: Utensils
    },
    {
      title: "Profile",
      url: createPageUrl("Profile"),
      icon: User
    }
  ];

  // Check if current page is WorkoutSession
  const isCurrentlyWorkoutSessionPage = currentPageName === "WorkoutSession";

  // If in workout mode, render only the content without navigation
  if (isWorkoutMode) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-black">
        <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@100;200;300;400;500;600;700&display=swap" rel="stylesheet" />
        
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-5 animate-blob" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl opacity-5 animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-3xl opacity-5 animate-blob animation-delay-4000" />
        </div>

        <style>{`
          * {
            font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-weight: 200;
          }
          
          h1, h2, h3, h4, h5, h6 {
            font-weight: 300;
          }
          
          strong, b {
            font-weight: 400;
          }
          
          @keyframes blob {
            0%, 100% {
              transform: translate(0, 0) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
          }
          .animate-blob {
            animation: blob 20s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          .glass {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
          }
          .glass-strong {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(30px);
            -webkit-backdrop-filter: blur(30px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.7), inset 0 0 20px rgba(255, 255, 255, 0.02);
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          
          input[type=number]::-webkit-inner-spin-button,
          input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type=number] {
            -moz-appearance: textfield;
          }
        `}</style>

        <main className="relative z-10">
          {children}
        </main>
      </div>
    );
  }

  // Normal layout with navigation
  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@100;200;300;400;500;600;700&display=swap" rel="stylesheet" />
      
      {/* Active Workout Bar - Only show if NOT on WorkoutSession page */}
      {!isCurrentlyWorkoutSessionPage && <ActiveWorkoutBar />}
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-5 animate-blob" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl opacity-5 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-3xl opacity-5 animate-blob animation-delay-4000" />
      </div>

      <style>{`
        * {
          font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-weight: 200;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-weight: 300;
        }
        
        strong, b {
          font-weight: 400;
        }
        
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 20s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
        }
        .glass-strong {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.7), inset 0 0 20px rgba(255, 255, 255, 0.02);
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      <aside className="hidden md:block fixed left-0 top-0 h-full w-64 z-40 p-4">
        <div className="glass-strong rounded-3xl h-full flex flex-col shadow-2xl">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <Dumbbell className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-xl font-light text-white">FitFlow</h1>
                <p className="text-xs text-white/70">Your Fitness Journey</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? 'glass-strong'
                      : 'hover:glass'
                  }`}
                >
                  <item.icon className="w-5 h-5 text-white" />
                  <span className="text-white font-light">{item.title}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4">
            <button
              onClick={() => base44.auth.logout()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:glass transition-all duration-300 text-white/80 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-light">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
        <div className="glass-strong border-t border-white/10">
          <div className="flex items-center justify-around px-2 py-3">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 min-w-[60px]"
                >
                  <item.icon className={`w-6 h-6 transition-all ${
                    isActive ? 'text-white scale-110' : 'text-white/50 scale-100'
                  }`} />
                  <span className={`text-xs font-light ${isActive ? 'text-white' : 'text-white/50'}`}>
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="md:ml-72 relative z-10 p-4 md:p-8 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}
