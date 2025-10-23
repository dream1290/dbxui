import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Bell, User, Search } from "lucide-react";
import { useNotifications } from "@/hooks/api/useNotifications";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const { data: notifications } = useNotifications({ autoRefresh: true });
  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Top Navigation Bar */}
          <header className="h-16 border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center justify-between h-full px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors" />
                <div className="hidden md:flex items-center gap-2 max-w-md">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search flights, aircraft, analyses..."
                    className="bg-input/50 border border-border/30 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Real-time Status Indicator */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <div className="h-2 w-2 bg-primary rounded-full animate-genomic-pulse"></div>
                  <span className="text-xs text-primary font-medium">Live Analysis</span>
                </div>

                {/* Notification Bell */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative"
                  onClick={() => navigate('/notifications')}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{unreadCount}</span>
                    </div>
                  )}
                </Button>

                {/* User Profile */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate('/profile')}
                >
                  <User className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}