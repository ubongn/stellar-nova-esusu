import { useState, useEffect } from "react";
import { ToastProvider } from "./components/ToastProvider";
import { ToastViewport } from "./components/Toast";
import { WalletProvider } from "./hooks/useWallet";
import { Header } from "./components/Header";
import { Dashboard } from "./pages/Dashboard";
import { CircleDetail } from "./pages/CircleDetail";
import { CreateCircle } from "./pages/CreateCircle";

type Route =
  | { name: "dashboard" }
  | { name: "circle"; id: number }
  | { name: "create" };

/** Read #/circle/:id hash routes so links are shareable + refresh-safe. */
function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (hash.startsWith("circle/")) {
    const id = Number(hash.split("/")[1]);
    if (Number.isFinite(id) && id > 0) return { name: "circle", id };
  }
  if (hash === "create") return { name: "create" };
  return { name: "dashboard" };
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function navigate(next: Route) {
    if (next.name === "dashboard") window.location.hash = "/";
    else if (next.name === "create") window.location.hash = "/create";
    else window.location.hash = `/circle/${next.id}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <ToastProvider>
      <WalletProvider>
        <div className="flex min-h-screen flex-col">
          <Header onNavigate={() => navigate({ name: "dashboard" })} />

          <div className="flex-1">
            {route.name === "dashboard" && (
              <Dashboard
                onOpenCircle={(id) => navigate({ name: "circle", id })}
                onCreate={() => navigate({ name: "create" })}
              />
            )}
            {route.name === "circle" && (
              <CircleDetail circleId={route.id} onBack={() => navigate({ name: "dashboard" })} />
            )}
            {route.name === "create" && (
              <CreateCircle
                onBack={() => navigate({ name: "dashboard" })}
                onCreated={(id) => navigate({ name: "circle", id })}
              />
            )}
          </div>

          <ToastViewport />
        </div>
      </WalletProvider>
    </ToastProvider>
  );
}
