import { useEffect, useState, useMemo } from "react";

interface AgentSkill {
  id: string;
  name: string;
  domains: Record<string, number>;
  description?: string;
}

interface SkillsData {
  agents: AgentSkill[];
  domains: string[];
}

function SkillLevel({ level }: { level: number }) {
  const color =
    level >= 4
      ? "bg-[#30d158] text-black"
      : level >= 3
        ? "bg-[#5856d6] text-white"
        : level >= 2
          ? "bg-[#ff9f0a] text-black"
          : level >= 1
            ? "bg-[#2c2c2e] text-white"
            : "bg-transparent text-[rgba(255,255,255,0.2)]";
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${color}`}>
      {level || "—"}
    </span>
  );
}

export function Skills() {
  const [data, setData] = useState<SkillsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<string>("");
  const [matchQuery, setMatchQuery] = useState("");

  useEffect(() => {
    fetch("http://localhost:5490/v1/agents")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        const agents: AgentSkill[] = Array.isArray(json) ? json : json.agents ?? [];
        const domainSet = new Set<string>();
        for (const agent of agents) {
          if (agent.domains) {
            for (const d of Object.keys(agent.domains)) domainSet.add(d);
          }
        }
        setData({ agents, domains: [...domainSet].sort() });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const gaps = useMemo(() => {
    if (!data) return [];
    return data.domains.filter((domain) => {
      const maxLevel = Math.max(0, ...data.agents.map((a) => a.domains?.[domain] ?? 0));
      return maxLevel < 4;
    });
  }, [data]);

  const matchResults = useMemo(() => {
    if (!data || !matchQuery.trim()) return null;
    const queryDomains = matchQuery
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    return data.agents
      .map((agent) => {
        const score = queryDomains.reduce((sum, d) => {
          const match = Object.entries(agent.domains || {}).find(([k]) => k.toLowerCase().includes(d));
          return sum + (match ? match[1] : 0);
        }, 0);
        return { agent, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [data, matchQuery]);

  const filteredDomains = useMemo(() => {
    if (!data) return [];
    if (!domainFilter) return data.domains;
    return data.domains.filter((d) => d.toLowerCase().includes(domainFilter.toLowerCase()));
  }, [data, domainFilter]);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🧠 Skills</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Agent skill profiles and coverage matrix from Shre Skills API
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Loading skills data from shre-skills API...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-[#ff453a]/30 bg-[#ff453a]/10 p-6">
            <p className="text-sm text-[#ff453a] font-medium">Failed to load skills data</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Make sure shre-skills is running at http://localhost:5490
            </p>
          </div>
        )}

        {data && (
          <>
            {/* Match Widget */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-foreground mb-2">🎯 Skill Matcher</h2>
              <input
                type="text"
                value={matchQuery}
                onChange={(e) => setMatchQuery(e.target.value)}
                placeholder="Type skill requirements (comma-separated)..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-[#5856d6]"
              />
              {matchResults && matchResults.length > 0 && (
                <div className="mt-3 space-y-1">
                  {matchResults.map((r) => (
                    <div key={r.agent.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-background">
                      <span className="text-sm font-medium text-foreground flex-1">{r.agent.name}</span>
                      <span className="text-xs text-[#5856d6] font-bold">Score: {r.score}</span>
                    </div>
                  ))}
                </div>
              )}
              {matchResults && matchResults.length === 0 && (
                <p className="mt-2 text-xs text-muted-foreground">No agents match those requirements.</p>
              )}
            </div>

            {/* Gap Detection */}
            {gaps.length > 0 && (
              <div className="rounded-xl border border-[#ff9f0a]/30 bg-[#ff9f0a]/10 p-4">
                <h2 className="text-sm font-semibold text-[#ff9f0a] mb-2">⚠️ Skill Gaps (no agent at level 4+)</h2>
                <div className="flex flex-wrap gap-2">
                  {gaps.map((g) => (
                    <span key={g} className="px-2 py-1 rounded-md bg-[#ff9f0a]/20 text-xs text-[#ff9f0a] font-medium">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Domain Filter */}
            <div>
              <input
                type="text"
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                placeholder="Filter domains..."
                className="w-64 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-[#5856d6]"
              />
            </div>

            {/* Coverage Matrix */}
            <div className="rounded-xl border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground sticky left-0 bg-card">Agent</th>
                    {filteredDomains.map((d) => (
                      <th key={d} className="text-center px-2 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.agents.map((agent) => (
                    <tr key={agent.id} className="border-b border-border/50 hover:bg-accent/30">
                      <td className="px-4 py-2 text-sm font-medium text-foreground sticky left-0 bg-card whitespace-nowrap">
                        {agent.name}
                      </td>
                      {filteredDomains.map((d) => (
                        <td key={d} className="text-center px-2 py-2">
                          <SkillLevel level={agent.domains?.[d] ?? 0} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
