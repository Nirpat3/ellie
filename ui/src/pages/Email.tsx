import { useEffect, useState } from "react";

interface EmailSummary {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  read: boolean;
  labels?: string[];
}

export function Email() {
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:5480/v1/email/inbox")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setEmails(Array.isArray(json) ? json : json.emails ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📧 Email</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Read-only email triage view from shre-gmail
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Loading inbox...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-[#ff9f0a]/30 bg-[#ff9f0a]/10 p-6">
            <p className="text-sm text-[#ff9f0a] font-medium">Email service unavailable</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && emails.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            No emails to show. Connect shre-gmail to view your inbox here.
          </div>
        )}

        {emails.length > 0 && (
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {emails.map((email) => (
              <div key={email.id} className={`px-6 py-4 ${email.read ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground flex-1 truncate">{email.from}</span>
                  <span className="text-xs text-muted-foreground">{email.date}</span>
                </div>
                <p className="text-sm font-semibold text-foreground mt-1">{email.subject}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{email.snippet}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
