import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { Dashboard } from "./pages/Dashboard";
import { ChatRoom } from "./pages/ChatRoom";
import { VerifyEmail } from "./pages/VerifyEmail";
import { Settings } from "./pages/Settings";

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/forums/:id" element={<ChatRoom />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
