import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import PageLoader from "./PageLoader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * ✅ Role-Based Security Guard
 * Checks if the user is authenticated and has the correct role before rendering the page.
 * If not, it redirects them to the appropriate dashboard or home page.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  // 1. Show loader while checking session
  if (isLoading) {
    return <PageLoader />;
  }

  // 2. If not logged in, redirect to home/login
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 3. If role is not allowed, redirect to home
  if (allowedRoles && user && !allowedRoles.includes(user.role || "")) {
    console.warn(`🚫 Role Mismatch: ${user.role} tried to access ${location.pathname}`);
    return <Navigate to="/" replace />;
  }

  // 4. Everything is fine, let them in!
  return <>{children}</>;
};

export default ProtectedRoute;