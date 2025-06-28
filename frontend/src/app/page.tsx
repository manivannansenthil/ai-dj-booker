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
    city: "",
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

  // For testing: disable form fields and use a single Make Call button
  const testForm = {
    city: "New York City",
    startDate: "2024-07-01",
    endDate: "2024-07-08",
    style: "Groovy trance house, melodic techno/house",
    notes: "Happy hour sets, flexible, can send sampler.",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setShowAgent(true);
    setAgentStep(0);
    // Animate agent steps
    let step = 0;
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
        body: JSON.stringify(testForm),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Booking request sent!");
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
        {/* Booking Card */}
        <div className="w-full">
          <div className="backdrop-blur-md bg-white/60 shadow-2xl rounded-3xl p-10 flex flex-col items-center border border-white/40">
            <h1 className="text-3xl font-extrabold text-center mb-2 text-black tracking-tight drop-shadow-sm">
              DJ Booking Agent
            </h1>
          </div>
        </div>
        {/* Make Call Button */}
        <div className="w-full flex flex-col items-center">
          <button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-3 rounded-xl shadow-md hover:scale-105 hover:from-pink-500 hover:to-blue-600 transition-all duration-200 text-lg tracking-wide drop-shadow disabled:opacity-60 disabled:cursor-not-allowed w-full"
            disabled={loading}
          >
            {loading ? "Calling..." : "Make Call"}
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
        </div>
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
