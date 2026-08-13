import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfPLACEHOLDER/viewform";

export function Feedback() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const [experience, setExperience] = useState("");
  const [featureRequest, setFeatureRequest] = useState("");
  const [rating, setRating] = useState<number | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-extrabold text-gray-900">
          Thank you for your feedback!
        </h1>
        <p className="mt-2 text-gray-500">
          Your input helps us improve Nova Esusu for the community.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-extrabold text-gray-900">
          Share Your Feedback
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Help us improve Nova Esusu — your feedback shapes the product.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name or alias"
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              I am a…
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="user">User (circle member)</option>
              <option value="creator">Circle creator</option>
              <option value="developer">Developer / Builder</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Overall experience
            </label>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-bold transition ${
                    rating === n
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-gray-300 text-gray-500 hover:border-brand-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-gray-400">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              How was your experience?
            </label>
            <textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="What worked well? What was confusing or frustrating?"
              rows={4}
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Feature request */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Feature request (optional)
            </label>
            <textarea
              value={featureRequest}
              onChange={(e) => setFeatureRequest(e.target.value)}
              placeholder="What feature would make Nova Esusu more useful for you?"
              rows={3}
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <Button type="submit" className="w-full">
            <Send className="h-4 w-4" /> Submit Feedback
          </Button>
        </form>
      </div>
    </div>
  );
}
