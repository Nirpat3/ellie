import { useEffect, useState } from "react";

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  tags?: string[];
}

export function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://localhost:5480/v1/contacts")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setContacts(Array.isArray(json) ? json : json.contacts ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = contacts.filter(
    (c) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">👥 Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Contacts from shre-contacts API
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Loading contacts...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-[#ff9f0a]/30 bg-[#ff9f0a]/10 p-6">
            <p className="text-sm text-[#ff9f0a] font-medium">Contacts service unavailable</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-64 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-[#5856d6]"
            />

            {filtered.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                {contacts.length === 0
                  ? "No contacts yet. Connect shre-contacts to sync."
                  : "No contacts match your search."}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card divide-y divide-border">
                {filtered.map((contact) => (
                  <div key={contact.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#5856d6] flex items-center justify-center text-white text-sm font-bold">
                      {contact.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{contact.name}</p>
                      {contact.email && <p className="text-xs text-muted-foreground">{contact.email}</p>}
                      {contact.company && <p className="text-xs text-muted-foreground">{contact.company}</p>}
                    </div>
                    {contact.tags && contact.tags.length > 0 && (
                      <div className="flex gap-1">
                        {contact.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-md bg-[#5856d6]/20 text-xs text-[#5856d6]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
