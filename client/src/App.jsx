import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import FloatingAiBot from "./components/FloatingAiBot";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Companies from "./pages/Companies";
import Roles from "./pages/Roles";
import Dashboard from "./pages/Dashboard";
import QuestionSheet from "./pages/QuestionSheet";
import StudyPlan from "./pages/StudyPlan";
import MyProgress from "./pages/MyProgress";
import TestAssessment from "./pages/TestAssessment";
import MockInterview from "./pages/MockInterview";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[#fbfbf8] text-[#233b30] flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Preparation Flow */}
              <Route
                path="/companies"
                element={
                  <ProtectedRoute>
                    <Companies />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/companies/:companyId"
                element={
                  <ProtectedRoute>
                    <Roles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prep/:companyId/:role"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prep/:companyId/:role/sheet"
                element={
                  <ProtectedRoute>
                    <QuestionSheet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prep/:companyId/:role/plan"
                element={
                  <ProtectedRoute>
                    <StudyPlan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prep/:companyId/:role/test"
                element={
                  <ProtectedRoute>
                    <TestAssessment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prep/:companyId/:role/interview"
                element={
                  <ProtectedRoute>
                    <MockInterview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/me"
                element={
                  <ProtectedRoute>
                    <MyProgress />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <FloatingAiBot />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
