import { useEffect, useState } from "react";

interface ServiceStatus {
  name: string;
  status: "up" | "down" | "degraded" | "unknown";
  latency?: number;
  message?: string;
}

interface StatusData {
  overall: "healthy" | "degraded" | "down";
  services: ServiceStatus[];
  timestamp?: string;
}

function statusColor(status: string): string {
  switch (status) {
    case "up":
    case "healthy":
      return "#30d158";
    case "degraded":
      return "#ff9f0a";
    case "down":
      return "#ff453a";
    default:
      return "rgba(255,255,255,0.3)";
  }
}

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full"
      style={{ backgroundColor: statusColor(status) }}
    />
  );
}

export function SystemStatus() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = () => {
      fetch("http://localhost:5999/api")
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((json) => {
          setData(json);
          setError(null);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📊 System Status</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time health of Shre Neural OS services
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Checking system health...
          </div>
        )}

        {error && !data && (
          <div className="rounded-xl border border-[#ff453a]/30 bg-[#ff453a]/10 p-6">
            <p className="text-sm text-[#ff453a] font-medium">Status API unavailable</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Make sure shre-status is running at http://localhost:5999
            </p>
          </div>
        )}

        {data && (
          <>
            {/* Overall Status */}
            <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-4">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: statusColor(data.overall) }}
              />
              <div>
                <p className="text-lg font-semibold text-foreground capitalize">{data.overall}</p>
                {data.timestamp && (
                  <p className="text-xs text-muted-foreground">
                    Last checked: {new Date(data.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            {/* Services */}
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {data.services.map((svc) => (
                <div key={svc.name} className="flex items-center gap-4 px-6 py-4">
                  <StatusDot status={svc.status} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{svc.name}</p>
                    {svc.message && <p className="text-xs text-muted-foreground">{svc.message}</p>}
                  </div>
                  {svc.latency != null && (
                    <span className="text-xs text-muted-foreground">{svc.latency}ms</span>
                  )}
                  <span
                    className="text-xs font-medium capitalize px-2 py-0.5 rounded-md"
                    style={{
                      color: statusColor(svc.status),
                      backgroundColor: `${statusColor(svc.status)}20`,
                    }}
                  >
                    {svc.status}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Embedded Status Page */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground">Live Status Dashboard</p>
          </div>
          <iframe
            src="http://localhost:5999"
            className="w-full h-[500px] border-0"
            title="Shre System Status"
          />
        </div>
      </div>
    </div>
  );
}
