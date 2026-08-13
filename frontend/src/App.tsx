import { HashRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "@/context/ToastContext";
import { WalletProvider } from "@/context/WalletContext";
import { Header } from "@/components/Header";
import { Toaster } from "@/components/Toaster";
import { Dashboard } from "@/pages/Dashboard";
import { CircleDetail } from "@/pages/CircleDetail";
import { CreateCircle } from "@/pages/CreateCircle";
import { JoinCircle } from "@/pages/JoinCircle";
import { Feedback } from "@/pages/Feedback";

export default function App() {
  return (
    <ToastProvider>
      <WalletProvider>
        <HashRouter>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/circle/:id" element={<CircleDetail />} />
                <Route path="/create" element={<CreateCircle />} />
                <Route path="/join" element={<JoinCircle />} />
                <Route path="/feedback" element={<Feedback />} />
              </Routes>
            </main>
            <Toaster />
          </div>
        </HashRouter>
      </WalletProvider>
    </ToastProvider>
  );
}
