import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2, Users, Zap, Crown, Banknote } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { useToast } from "@/context/ToastContext";
import { joinCircle, getCircleState, getAllCircles } from "@/lib/contract";
import { classifyError } from "@/lib/wallet";
import { Button } from "@/components/ui/Button";
import { FullSpinner } from "@/components/Spinner";
import { cx, formatXlm, shortAddr } from "@/lib/utils";
import type { CircleInfo } from "@/lib/types";

export function JoinCircle() {
  const { address } = useWallet();
  const { push } = useToast();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [preview, setPreview] = useState<CircleInfo | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Browse available circles
  const [circles, setCircles] = useState<CircleInfo[]>([]);
  const [browsing, setBrowsing] = useState(true);

  useEffect(() => {
    getAllCircles()
      .then(setCircles)
      .catch(() => setCircles([]))
      .finally(() => setBrowsing(false));
  }, []);

  // Name-based search results
  const nameSearchResults = searchQuery.trim() && !/^\d+$/.test(searchQuery.trim())
    ? circles.filter((c) =>
        c.config.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setError("Enter a circle ID or name.");
      return;
    }

    setError(null);
    setPreview(null);
    setPreviewId(null);

    // If numeric → search by ID from contract
    if (/^\d+$/.test(query)) {
      const id = Number(query);
      setLoading(true);
      try {
        const info = await getCircleState(id);
        setPreview(info);
        setPreviewId(id);
      } catch (err) {
        setError(`Circle #${id} not found or network error.`);
      } finally {
        setLoading(false);
      }
    }
    // If text → name search results are shown inline (no API call needed)
  }

  function handleSelectNameResult(circle: CircleInfo, index: number) {
    setPreview(circle);
    setPreviewId(index + 1); // circles are 1-indexed
    setSearchQuery(circle.config.name);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleJoin() {
    if (!address) {
      setError("Connect your wallet first.");
      return;
    }
    if (previewId === null) return;
    setError(null);
    setJoining(true);
    try {
      await joinCircle(address, previewId, {
        onStatus: (s) => {
          if (s === "done") {
            push({ type: "success", title: "Joined!", message: `You joined circle #${previewId}` });
            setTimeout(() => navigate(`/circle/${previewId}`), 600);
          }
        },
      });
    } catch (err) {
      const classified = classifyError(err instanceof Error ? err.cause ?? err : err);
      setError(classified.message);
      push({ type: "error", title: "Failed to join", message: classified.message });
    } finally {
      setJoining(false);
    }
  }

  const pendingCircles = circles.filter((c) => c.state === "Pending");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-extrabold text-gray-900">Join a Savings Circle</h1>
      <p className="mt-1 text-sm text-gray-500">
        Search by circle ID or name, or browse available circles below.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Search by ID or Name */}
      <form onSubmit={handleSearch} className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter circle ID or name (e.g. 1 or 'Quick Test')"
            className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <Button type="submit" loading={loading} variant="secondary">
          Look Up
        </Button>
      </form>

      {/* Name search results */}
      {nameSearchResults.length > 0 && (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-700">
            Found {nameSearchResults.length} circle{nameSearchResults.length > 1 ? "s" : ""} matching "{searchQuery}"
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {nameSearchResults.map((c, i) => {
              const circleIndex = circles.indexOf(c) + 1; // 1-indexed
              const isMember = c.members.includes(address ?? "");
              return (
                <button
                  key={i}
                  onClick={() => handleSelectNameResult(c, circles.indexOf(c))}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-left transition hover:border-brand-300 hover:bg-brand-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{c.config.name}</span>
                    <span className={cx(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      c.state === "Active" && "bg-emerald-100 text-emerald-700",
                      c.state === "Pending" && "bg-amber-100 text-amber-700",
                      c.state === "Completed" && "bg-gray-100 text-gray-600",
                      c.state === "Closed" && "bg-red-100 text-red-600"
                    )}>
                      {c.state}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Circle #{circleIndex} · {c.members.length}/{c.config.size} members · {formatXlm(c.config.contribution_amount)} XLM
                  </p>
                  {isMember && (
                    <span className="mt-1 inline-block text-xs font-medium text-emerald-600">✓ Already joined</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Name search with no results */}
      {searchQuery.trim() && !/^\d+$/.test(searchQuery.trim()) && nameSearchResults.length === 0 && !loading && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
          No circles found matching "{searchQuery}". Try a different name or enter a circle ID.
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{preview.config.name}</h2>
              <p className="mt-1 text-xs text-gray-500">
                Circle #{previewId} · Created by {shortAddr(preview.config.creator)}
              </p>
            </div>
            <span
              className={cx(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                preview.state === "Active" && "bg-emerald-100 text-emerald-700",
                preview.state === "Pending" && "bg-amber-100 text-amber-700",
                preview.state === "Completed" && "bg-gray-100 text-gray-600"
              )}
            >
              {preview.state}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-white p-3 text-center">
              <Users className="mx-auto h-4 w-4 text-brand-500" />
              <p className="mt-1 text-xs text-gray-500">Members</p>
              <p className="text-sm font-bold">{preview.members.length}/{preview.config.size}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-center">
              <Banknote className="mx-auto h-4 w-4 text-brand-500" />
              <p className="mt-1 text-xs text-gray-500">Per Round</p>
              <p className="text-sm font-bold">{formatXlm(preview.config.contribution_amount)} XLM</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-center">
              <Zap className="mx-auto h-4 w-4 text-brand-500" />
              <p className="mt-1 text-xs text-gray-500">Rounds</p>
              <p className="text-sm font-bold">{preview.config.cycle_count}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-center">
              <Crown className="mx-auto h-4 w-4 text-brand-500" />
              <p className="mt-1 text-xs text-gray-500">Round</p>
              <p className="text-sm font-bold">{preview.current_round}/{preview.config.cycle_count}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            {preview.members.includes(address ?? "") ? (
              <span className="text-sm font-medium text-emerald-700">✓ You're already a member</span>
            ) : preview.members.length >= preview.config.size ? (
              <span className="text-sm font-medium text-gray-500">Circle is full</span>
            ) : preview.state !== "Pending" ? (
              <span className="text-sm font-medium text-gray-500">Circle already started — cannot join</span>
            ) : !address ? (
              <span className="text-sm text-amber-700">Connect wallet to join</span>
            ) : (
              <Button onClick={handleJoin} loading={joining}>
                Join This Circle
              </Button>
            )}
            <Link
              to={`/circle/${previewId}`}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              View details →
            </Link>
          </div>
        </div>
      )}

      {/* Browse all pending circles */}
      <div className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <Zap className="h-5 w-5 text-brand-500" />
          Open Circles (Waiting for Members)
        </h2>
        {browsing ? (
          <FullSpinner label="Loading circles…" />
        ) : pendingCircles.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">
            No circles waiting for members.{" "}
            <Link to="/create" className="text-brand-600 hover:underline">
              Create one!
            </Link>
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {pendingCircles.map((c, i) => {
              const isMember = c.members.includes(address ?? "");
              const isFull = c.members.length >= c.config.size;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-card transition hover:shadow-card-hover"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-gray-900">{c.config.name}</h3>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Pending
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {c.members.length}/{c.config.size}
                    </span>
                    <span className="flex items-center gap-1">
                      <Banknote className="h-3.5 w-3.5" />
                      {formatXlm(c.config.contribution_amount)} XLM
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5" />
                      {c.config.cycle_count} rounds
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {isMember ? (
                      <span className="text-xs font-medium text-emerald-600">✓ Joined</span>
                    ) : isFull ? (
                      <span className="text-xs text-gray-400">Full</span>
                    ) : (
                      <Link
                        to={`/join`}
                        onClick={() => {
                          setCircleId(String(i));
                          setPreview(c);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="text-xs font-semibold text-brand-600 hover:underline"
                      >
                        Join →
                      </Link>
                    )}
                    <Link to={`/circle/${i}`} className="text-xs text-gray-400 hover:text-gray-600">
                      Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
