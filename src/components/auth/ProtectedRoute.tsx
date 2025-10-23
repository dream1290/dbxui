import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: readonly string[];
    requireAuth?: boolean;
}

export const ProtectedRoute = ({
    children,
    allowedRoles = [],
    requireAuth = true
}: ProtectedRouteProps) => {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access
    if (allowedRoles.length > 0 && user) {
        const userRole = user.role || '';
        const hasAccess = allowedRoles.includes(userRole);

        if (!hasAccess) {
            // Redirect to dashboard with access denied message
            return <Navigate to="/dashboard" state={{ accessDenied: true }} replace />;
        }
    }

    return <>{children}</>;
};
