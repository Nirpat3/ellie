import { createDb } from "./client.js";
import { companies, agents, goals } from "./schema/index.js";
import { eq } from "drizzle-orm";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const db = createDb(url);

console.log("🧠 Seeding Shre Neural OS organization...");

// Create company
const [company] = await db
  .insert(companies)
  .values({
    name: "Shre Neural OS",
    description: "Distributed neural AI operating system — the Shre collective intelligence",
    status: "active",
    budgetMonthlyCents: 100000,
    brandColor: "#5856d6",
    issuePrefix: "SHRE",
  })
  .returning();

const companyId = company!.id;

// Create agents
const agentDefs = [
  { extId: "main", name: "Ellie", emoji: "✨", model: "anthropic/claude-sonnet-4-6", role: "chief_of_staff", title: "Chief of Staff" },
  { extId: "founding-engineer", name: "Forge", emoji: "🔧", model: "anthropic/claude-opus-4-6", role: "engineer", title: "Founding Engineer" },
  { extId: "engineering-manager", name: "Engineering", emoji: "⚙️", model: "anthropic/claude-opus-4-6", role: "engineering_manager", title: "Engineering Manager" },
  { extId: "ops-manager", name: "Operations", emoji: "🔄", model: "anthropic/claude-sonnet-4-6", role: "operations", title: "Operations Manager" },
  { extId: "devops-manager", name: "DevOps", emoji: "🖥️", model: "anthropic/claude-sonnet-4-6", role: "devops", title: "DevOps Engineer" },
  { extId: "president", name: "President", emoji: "🏛️", model: "anthropic/claude-opus-4-6", role: "president", title: "President / Strategic Advisor" },
  { extId: "nova", name: "Nova", emoji: "🌟", model: "anthropic/claude-opus-4-6", role: "advisor", title: "Strategic Advisor" },
  { extId: "product-manager", name: "Product", emoji: "🎯", model: "anthropic/claude-sonnet-4-6", role: "product", title: "Product Manager" },
  { extId: "qa-manager", name: "QA", emoji: "🔍", model: "anthropic/claude-sonnet-4-6", role: "qa", title: "QA Engineer" },
  { extId: "finance-manager", name: "Finance", emoji: "💰", model: "anthropic/claude-sonnet-4-6", role: "finance", title: "Finance Manager" },
];

const agentMap: Record<string, string> = {};

for (const def of agentDefs) {
  const [agent] = await db
    .insert(agents)
    .values({
      companyId,
      name: `${def.emoji} ${def.name}`,
      role: def.role,
      title: def.title,
      status: "idle",
      adapterType: "openclaw_gateway",
      adapterConfig: {
        url: "ws://127.0.0.1:18789",
        agentId: def.extId,
        model: def.model,
        sessionKeyStrategy: "fixed",
        sessionKey: def.extId,
      },
      budgetMonthlyCents: 10000,
    })
    .returning();
  agentMap[def.extId] = agent!.id;
}

// Set org chart reporting lines
// President → Ellie reports to President
await db.update(agents).set({ reportsTo: agentMap["president"] }).where(eq(agents.id, agentMap["main"]!));

// Ellie manages: Forge, Engineering, Ops, Product, QA, Finance
for (const id of ["founding-engineer", "engineering-manager", "ops-manager", "product-manager", "qa-manager", "finance-manager"]) {
  await db.update(agents).set({ reportsTo: agentMap["main"] }).where(eq(agents.id, agentMap[id]!));
}

// Engineering manages DevOps
await db.update(agents).set({ reportsTo: agentMap["engineering-manager"] }).where(eq(agents.id, agentMap["devops-manager"]!));

// Nova reports to President
await db.update(agents).set({ reportsTo: agentMap["president"] }).where(eq(agents.id, agentMap["nova"]!));

// Create initial goal
await db.insert(goals).values({
  companyId,
  title: "Build Shre Neural OS",
  description: "Create the distributed neural AI operating system with full agent orchestration, memory management, and self-improving capabilities",
  level: "company",
  status: "active",
  ownerAgentId: agentMap["main"],
});

console.log("✅ Shre Neural OS seed complete!");
console.log(`   Company: Shre Neural OS (${companyId})`);
console.log(`   Agents: ${agentDefs.length} agents created`);
console.log(`   Org chart: President → Ellie → Team configured`);
process.exit(0);
