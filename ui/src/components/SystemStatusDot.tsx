import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router";

type OverallStatus = "healthy" | "degraded" | "down" | "unknown";

const STATUS_COLORS: Record<OverallStatus, string> = {
  healthy: "#30d158",
  degraded: "#ff9f0a",
  down: "#ff453a",
  unknown: "rgba(255,255,255,0.3)",
};

export function SystemStatusDot() {
  const [status, setStatus] = useState<OverallStatus>("unknown");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStatus = () => {
      fetch("http://localhost:5999/api")
        .then((res) => {
          if (!res.ok) throw new Error("not ok");
          return res.json();
        })
        .then((json) => setStatus(json.overall ?? "healthy"))
        .catch(() => setStatus("unknown"));
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={() => navigate("/status")}
      className="relative flex items-center justify-center w-6 h-6 rounded-md hover:bg-accent/50 transition-colors"
      title={`System: ${status}`}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: STATUS_COLORS[status] }}
      />
      {status === "down" && (
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            backgroundColor: STATUS_COLORS.down,
            opacity: 0.4,
            width: 8,
            height: 8,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </button>
  );
}
