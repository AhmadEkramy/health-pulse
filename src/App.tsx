import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from 'react';
import { AuthProvider } from './lib/AuthContext';
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import WaterTracking from "./components/WaterTracking";
import ActivityTracking from "./components/ActivityTracking";
import SleepTracking from "./components/SleepTracking";
import Reports from "./components/Reports";
import Goals from "./components/Goals";
import Reminders from "./components/Reminders";
import StepsTracking from "./components/StepsTracking";
import HeartRateMonitoring from "./components/HeartRateMonitoring";
import BloodSugarMonitoring from "./components/BloodSugarMonitoring";
import BloodPressureMonitoring from "./components/BloodPressureMonitoring";
import Settings from "./components/Settings";
import NotFound from "./pages/NotFound";
import NutritionTracking from "./components/NutritionTracking";

const queryClient = new QueryClient();

const App = () => {
  const [isRTL, setIsRTL] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen">
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage isRTL={isRTL} setIsRTL={setIsRTL} />} />
                <Route path="/signin" element={<AuthPage isRTL={isRTL} setIsRTL={setIsRTL} />} />
                <Route path="/auth" element={<AuthPage isRTL={isRTL} setIsRTL={setIsRTL} />} />
                <Route path="/dashboard" element={<Dashboard isRTL={isRTL} />} />
                <Route path="/nutrition" element={<NutritionTracking isRTL={isRTL} />} />
                <Route path="/water" element={<WaterTracking isRTL={isRTL} />} />
                <Route path="/activity" element={<ActivityTracking isRTL={isRTL} />} />
                <Route path="/sleep" element={<SleepTracking isRTL={isRTL} />} />
                <Route path="/reports" element={<Reports isRTL={isRTL} />} />
                <Route path="/goals" element={<Goals isRTL={isRTL} />} />
                <Route path="/reminders" element={<Reminders isRTL={isRTL} />} />
                <Route path="/steps" element={<StepsTracking isRTL={isRTL} />} />
                <Route path="/heart-rate" element={<HeartRateMonitoring isRTL={isRTL} />} />
                <Route path="/blood-sugar" element={<BloodSugarMonitoring isRTL={isRTL} />} />
                <Route path="/blood-pressure" element={<BloodPressureMonitoring isRTL={isRTL} />} />
                <Route path="/settings" element={<Settings isRTL={isRTL} />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
