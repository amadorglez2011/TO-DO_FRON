import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import EditProfile from "./pages/EditProfile.tsx";
import ProtectedRoute from "./routes/ProtectedRoute.tsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas*/}
        <Route path="/" element={<Login />} />
       <Route path="/register" element={<Register />} />

        {/* Rutas protegidas */}
        <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
          <Dashboard />
          </ProtectedRoute>
        } 
        />
        <Route 
        path="/profile/edit" 
        element={
          <ProtectedRoute>
          <EditProfile />
          </ProtectedRoute>
        } 
        />
        {/* Redirigir cualquier ruta no definida a la página de inicio de sesión */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);