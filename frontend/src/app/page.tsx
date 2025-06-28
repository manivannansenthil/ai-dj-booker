"use client";
import { useState, useEffect } from "react";

const agentSteps = [
  "Analyzing your info...",
  "Finding venues in your area...",
  "Calling the first venue...",
  "Waiting for response...",
  "Booking in progress...",
  "Done! Check your dashboard soon.",
];

export default function Home() {
  const [form, setForm] = useState({
    venue: "",
    startDate: "",
    endDate: "",
    style: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showAgent, setShowAgent] = useState(false);
  const [agentStep, setAgentStep] = useState(0);
  const [callResults, setCallResults] = useState<any[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setShowAgent(true);
    setAgentStep(0);
    // Animate agent steps
    const step = 0;
    const interval = setInterval(() => {
      setAgentStep((prev) => {
        if (prev < agentSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1200);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Booking request sent!");
        setForm({
          venue: "",
          startDate: "",
          endDate: "",
          style: "",
          notes: "",
        });
      } else {
        setMessage(data.error || "❌ Something went wrong.");
      }
    } catch (err) {
      setMessage("❌ Network error.");
    } finally {
      setLoading(false);
    }
  };

  // Poll for Bland AI call results after form submission
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showAgent) {
      const fetchResults = async () => {
        try {
          const res = await fetch("/api/bland-status");
          const data = await res.json();
          setCallResults(data.results || []);
        } catch {}
      };
      fetchResults();
      interval = setInterval(fetchResults, 3000);
    }
    return () => clearInterval(interval);
  }, [showAgent]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-pink-100 p-4">
      <div className="w-full max-w-2xl flex flex-col items-center gap-6 mx-auto">
        {/* Booking Card with Form */}
        <form
          onSubmit={handleSubmit}
          className="backdrop-blur-md bg-white/60 shadow-2xl rounded-3xl p-10 w-full flex flex-col gap-8 border border-white/40"
          style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)" }}
        >
          <h1 className="text-3xl font-extrabold text-center mb-2 text-black tracking-tight drop-shadow-sm">
            DJ Booking Agent
          </h1>
          <div>
            <label
              className="block text-base font-semibold mb-2 text-black"
              htmlFor="venue"
            >
              Venue Name
            </label>
            <input
              type="text"
              id="venue"
              name="venue"
              value={form.venue}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black bg-white/80 transition-all duration-200 shadow-sm placeholder-gray-400"
              placeholder="e.g. Arcana, Elsewhere, House of Yes"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label
                className="block text-base font-semibold mb-2 text-black"
                htmlFor="startDate"
              >
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black bg-white/80 transition-all duration-200 shadow-sm"
              />
            </div>
            <div className="flex-1">
              <label
                className="block text-base font-semibold mb-2 text-black"
                htmlFor="endDate"
              >
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black bg-white/80 transition-all duration-200 shadow-sm"
              />
            </div>
          </div>
          <div>
            <label
              className="block text-base font-semibold mb-2 text-black"
              htmlFor="style"
            >
              DJ Style / Genre
            </label>
            <input
              type="text"
              id="style"
              name="style"
              value={form.style}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black bg-white/80 transition-all duration-200 shadow-sm placeholder-gray-400"
              placeholder="e.g. House, Techno, Open Format"
            />
          </div>
          <div>
            <label
              className="block text-base font-semibold mb-2 text-black"
              htmlFor="notes"
            >
              Special Notes / Extra Info
            </label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black bg-white/80 transition-all duration-200 shadow-sm placeholder-gray-400"
              placeholder="e.g. I bring my own gear, have a big following, etc."
            />
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-3 rounded-xl shadow-md hover:scale-105 hover:from-pink-500 hover:to-blue-600 transition-all duration-200 text-lg tracking-wide drop-shadow disabled:opacity-60 disabled:cursor-not-allowed w-full"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
          {message && (
            <div
              className={`text-center text-base font-semibold mt-2 ${
                message.startsWith("✅") ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </div>
          )}
        </form>
        {/* Agent Panel */}
        <div className="w-full flex flex-col items-center">
          <div
            className="backdrop-blur-md bg-white/60 shadow-xl rounded-3xl p-8 w-full border border-white/40 flex flex-col items-center"
            style={{ boxShadow: "0 4px 24px 0 rgba(31, 38, 135, 0.10)" }}
          >
            <div className="mb-4 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-pink-400 flex items-center justify-center shadow-lg border-4 border-white">
                <span className="text-4xl">🤖</span>
              </div>
              <div className="mt-2 text-lg font-bold text-black">
                Bland AI Agent
              </div>
            </div>
            <div className="w-full flex flex-col gap-2 mt-2">
              {showAgent && callResults.length > 0 ? (
                callResults
                  .slice(-5)
                  .reverse()
                  .map((result, i) => (
                    <div
                      key={i}
                      className="rounded-lg px-4 py-2 text-black bg-white/80 shadow-sm border border-gray-100 transition-all duration-300"
                    >
                      <div className="font-bold">
                        {result.venue || result.to || "Unknown Venue"}
                      </div>
                      <div className="text-sm">
                        Status: {result.status || result.state || "N/A"}
                      </div>
                      {result.message && (
                        <div className="text-xs text-gray-600">
                          {result.message}
                        </div>
                      )}
                      {result.receivedAt && (
                        <div className="text-xs text-gray-400">
                          {new Date(result.receivedAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  ))
              ) : showAgent ? (
                agentSteps.slice(0, agentStep + 1).map((step, i) => (
                  <div
                    key={i}
                    className={`rounded-lg px-4 py-2 text-black bg-white/80 shadow-sm border border-gray-100 ${
                      i === agentStep ? "font-bold bg-blue-100" : ""
                    } transition-all duration-300`}
                  >
                    {step}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center">
                  Agent status will appear here after you submit the form.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
