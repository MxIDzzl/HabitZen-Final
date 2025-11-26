import React, { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { HabitsProvider } from "./contexts/HabitsContext";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { MyHabits } from "./components/MyHabits";
import { Statistics } from "./components/Statistics";
import { Friends } from "./components/Friends";
import { Community } from "./components/Community";
import { Settings } from "./components/Settings";
import { BottomNavigation } from "./components/BottomNavigation";
import { DatabaseTest } from "./components/DatabaseTest";
import { DatabaseInspector } from "./components/DatabaseInspector";
import { Button } from "./components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./components/ui/avatar";
import { Toaster } from "./components/ui/sonner";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";

function AppContent() {
  const { user, logout, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false); // Desactivado - ya no es necesario

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Si estamos en configuración, mostrar ese componente
  if (showSettings) {
    return <Settings onBack={() => setShowSettings(false)} />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "habits":
        return <MyHabits />;
      case "stats":
        return <Statistics />;
      case "friends":
        return <Friends />;
      case "community":
        return <Community />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">
                HZ
              </span>
            </div>
            <span className="font-bold text-gray-900">
              HabitZen
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowSettings(true)}>
                <SettingsIcon className="w-4 h-4 mr-2" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <main className="min-h-screen">{renderActiveTab()}</main>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Toast Notifications */}
      <Toaster />

      {/* Database Test */}
      {showDiagnostic && <DatabaseTest />}
      {showDiagnostic && <DatabaseInspector />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HabitsProvider>
        <AppContent />
      </HabitsProvider>
    </AuthProvider>
  );
}