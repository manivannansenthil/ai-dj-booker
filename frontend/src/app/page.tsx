"use client";
import { useState, useEffect, useRef } from "react";

const agentSteps = [
  "Analyzing your info...",
  "Finding venues in your area...",
  "Calling the first venue...",
  "Waiting for response...",
  "Booking in progress...",
  "Done! Check your dashboard soon.",
];

type ContactResult = { email?: string; phone?: string; [key: string]: unknown };

export default function Home() {
  const [form, setForm] = useState({
    venue: "",
    startDate: "",
    endDate: "",
    style: "",
    notes: "",
    agentName: "",
    talentName: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showAgent, setShowAgent] = useState(false);
  const [agentStep, setAgentStep] = useState(0);
  const [callResults, setCallResults] = useState<unknown[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testCallStatus, setTestCallStatus] = useState<
    null | "idle" | "pending" | "success" | "error"
  >(null);
  const [testCallResult, setTestCallResult] = useState<string | null>(null);
  const [testCallDone, setTestCallDone] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestCallStatus("pending");
    setTestCallResult(null);
    setTestCallDone(false);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          testCall: true,
          testPhoneNumber: testPhone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestCallStatus("success");
        setTestCallResult("Test call sent! Check your phone.");
        setTestCallDone(true);
      } else {
        setTestCallStatus("error");
        setTestCallResult(data.error || "Test call failed.");
      }
    } catch {
      setTestCallStatus("error");
      setTestCallResult("Network error.");
    }
  };

  const handleRedoTest = () => {
    setTestCallStatus(null);
    setTestCallResult(null);
    setTestCallDone(false);
  };

  const handleVenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setShowAgent(true);
    setAgentStep(0);
    // Animate agent steps
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
        body: JSON.stringify({ ...form, testCall: false }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast("✅ Booking request sent!");
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => setToast(null), 3500);
      } else {
        setMessage(data.error || "❌ Something went wrong.");
      }
    } catch {
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

  // Scroll to bottom handler
  const handleArrowClick = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-animated-shine p-4 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#232323] text-white px-6 py-3 rounded-2xl shadow-2xl text-lg font-semibold animate-fade-in-out border border-[#444cf7]">
          {toast}
        </div>
      )}
      {/* Animated Down Arrow for Scroll Indication */}
      <div
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 flex flex-col items-center cursor-pointer"
        onClick={handleArrowClick}
      >
        <svg
          className="w-8 h-8 text-white animate-bounce-down"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-stretch gap-8 mx-auto">
        {/* Booking Card with Form */}
        <div className="flex-1 flex flex-col justify-center">
          <form
            onSubmit={handleTestCall}
            className="bg-[#111] shadow-2xl rounded-3xl p-10 w-full flex flex-col gap-8 border-2 border-[#a259ff]/60"
          >
            <h1 className="text-3xl font-extrabold text-left mb-2 text-white tracking-tight">
              DJ Booking Agent
            </h1>
            <div>
              <label
                className="block text-base font-semibold mb-2 text-white"
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
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-white bg-white/80 transition-all duration-200 shadow-sm placeholder-gray-400"
                placeholder="e.g. Arcana, Elsewhere, House of Yes"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label
                  className="block text-base font-semibold mb-2 text-white"
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
                  className="w-full border border-[#444cf7] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#a259ff] text-white bg-[#18181b] transition-all duration-200 shadow-sm placeholder-gray-400"
                />
              </div>
              <div className="flex-1">
                <label
                  className="block text-base font-semibold mb-2 text-white"
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
                  className="w-full border border-[#444cf7] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#a259ff] text-white bg-[#18181b] transition-all duration-200 shadow-sm placeholder-gray-400"
                />
              </div>
            </div>
            <div>
              <label
                className="block text-base font-semibold mb-2 text-white"
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
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-white bg-white/80 transition-all duration-200 shadow-sm placeholder-gray-400"
                placeholder="e.g. House, Techno, Open Format"
              />
            </div>
            <div>
              <label
                className="block text-base font-semibold mb-2 text-white"
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
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-white bg-white/80 transition-all duration-200 shadow-sm placeholder-gray-400"
                placeholder="e.g. I bring my own gear, have a big following, etc."
              />
            </div>
            <div>
              <label
                className="block text-base font-semibold mb-2 text-white"
                htmlFor="agentName"
              >
                Booking Agent Name
              </label>
              <input
                type="text"
                id="agentName"
                name="agentName"
                value={form.agentName}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-white bg-white/80 transition-all duration-200 shadow-sm placeholder-gray-400"
                placeholder="e.g. Walter, Priya, Alex"
              />
            </div>
            <div>
              <label
                className="block text-base font-semibold mb-2 text-white"
                htmlFor="talentName"
              >
                Talent Name
              </label>
              <input
                type="text"
                id="talentName"
                name="talentName"
                value={form.talentName}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-white bg-white/80 transition-all duration-200 shadow-sm placeholder-gray-400"
                placeholder="e.g. Priya, Alex, Walter"
              />
            </div>
            <div>
              <label
                className="block text-base font-semibold mb-2 text-white"
                htmlFor="testPhone"
              >
                Your Phone Number (for Test Call)
              </label>
              <input
                type="tel"
                id="testPhone"
                name="testPhone"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-white bg-white/80 transition-all duration-200 shadow-sm placeholder-gray-400"
                placeholder="e.g. +15555555555"
              />
            </div>
            <button
              type="submit"
              className="bg-[#232323] text-white font-bold py-3 rounded-xl shadow-md text-lg tracking-wide disabled:opacity-60 disabled:cursor-not-allowed w-full border-none button-animated"
              disabled={loading || !testPhone}
            >
              {testCallStatus === "pending"
                ? "Sending Test Call..."
                : "Send Test Call"}
            </button>
            {testCallResult && (
              <div
                className={`text-center text-base font-semibold mt-2 ${
                  testCallStatus === "success"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {testCallResult}
              </div>
            )}
            {testCallDone && (
              <div className="flex flex-col gap-2 mt-4">
                <button
                  type="button"
                  className="bg-[#232323] text-white font-bold py-2 rounded-xl shadow-md text-base tracking-wide border-none button-animated"
                  onClick={handleRedoTest}
                >
                  Redo Test
                </button>
                <button
                  type="button"
                  className="bg-[#444cf7] text-white font-bold py-2 rounded-xl shadow-md text-base tracking-wide border-none button-animated"
                  onClick={handleVenueSubmit}
                  disabled={loading}
                >
                  Send to Venue(s)
                </button>
              </div>
            )}
            {message && (
              <div
                className={`text-center text-base font-semibold mt-2 ${
                  message.startsWith("✅") ? "text-green-400" : "text-red-400"
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </div>
        {/* Agent Panel */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="bg-[#18181b] shadow-2xl rounded-3xl p-8 w-full border-2 border-[#a259ff]/60 flex flex-col items-center">
            <div className="mb-4 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-[#232323] flex items-center justify-center shadow-lg border-4 border-[#18181b]">
                <span className="text-4xl text-white">🤖</span>
              </div>
              <div className="mt-2 text-lg font-bold text-white">
                Bland AI Agent
              </div>
            </div>
            <div className="w-full flex flex-col gap-2 mt-2">
              {showAgent && callResults.length > 0 ? (
                (() => {
                  // Find the most recent call result with email or phone
                  const contactResult = (callResults as ContactResult[]).find(
                    (r) => r.email || r.phone
                  );
                  return (
                    <>
                      {contactResult && (
                        <div className="rounded-lg px-4 py-2 mb-2 text-white bg-[#232323] border border-[#444cf7] shadow-sm flex flex-col items-start">
                          <div className="font-bold text-base mb-1">
                            Contact Info Collected:
                          </div>
                          {contactResult.email && (
                            <div className="text-sm">
                              Email:{" "}
                              <span className="font-mono">
                                {contactResult.email}
                              </span>
                            </div>
                          )}
                          {contactResult.phone && (
                            <div className="text-sm">
                              Phone:{" "}
                              <span className="font-mono">
                                {contactResult.phone}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()
              ) : showAgent ? (
                agentSteps.slice(0, agentStep + 1).map((step, i) => (
                  <div
                    key={i}
                    className={`rounded-lg px-4 py-2 text-white bg-white/80 shadow-sm border border-gray-100 ${
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
