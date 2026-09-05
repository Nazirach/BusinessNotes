import { invokeLLM } from "./_core/llm";
import { getProfile, getPublicEditorialById, listBusinessData, listPostSources, getOpportunityMatches, isPersonalizedRecommendationsEnabled, canUserDiscover } from "./db";

const compact = (value: unknown, max = 5000) => JSON.stringify(value).slice(0, max);

async function ask(system: string, user: string, maxTokens = 900) {
  const result = await invokeLLM({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    maxTokens,
  });
  return result.choices?.[0]?.message?.content ?? "";
}

export async function generateBusinessContent(userId: number, input: {
  prompt: string;
  format?: "post" | "article" | "headline" | "summary" | "video-script";
}) {
  if (!input.prompt.trim()) throw new Error("Prompt is required");
  const profile = await getProfile(userId);
  const format = input.format ?? "post";
  const output = await ask(
    "You are BusinessNotes AI. Produce useful business content. Never invent factual claims. If the user provides facts, preserve them; otherwise use neutral language and clearly mark assumptions. Return only the requested content.",
    `User profile: ${compact(profile, 1800)}
Format: ${format}
Request: ${input.prompt.trim()}
Keep the result concise, professional, publication-ready, and easy to review.`,
    1100
  );
  return { format, output: output.trim(), reviewedRequired: true };
}

export async function generateSourceGroundedAI(userId: number, input: { postId: number; question: string }) {
  if (!input.question.trim()) throw new Error("Question is required");
  const post = await getPublicEditorialById(input.postId);
  if (!post) throw new Error("Public editorial content not found");
  const sources = await listPostSources(input.postId);
  if (!sources.length && !post.source) {
    return {
      grounded: false,
      answer: "Tidak ada sumber yang cukup untuk menjawab secara ter-grounded.",
      facts: [],
      sources: [],
      analysis: [],
      confidence: "low",
    };
  }
  const sourceContext = sources.map(source => ({
    title: source.title,
    publisher: source.publisher,
    url: source.url,
    publishedAt: source.publishedAt,
    verificationStatus: source.verificationStatus,
    note: source.note,
  }));
  const answer = await ask(
    "You are a source-grounded business research assistant. Use ONLY the supplied editorial text and source metadata. Separate FACTS directly supported by the supplied material from ANALYSIS. Never fabricate a citation or claim that a source says something it does not say. If evidence is insufficient, say so.",
    `Editorial:
Title: ${post.title ?? ""}
Body: ${post.body}
Primary source: ${post.source ?? "none"}
Additional sources: ${compact(sourceContext, 7000)}
Question: ${input.question.trim()}
Return with these headings exactly: FACTS, ANALYSIS, LIMITATIONS.`,
    1300
  );
  return {
    grounded: true,
    answer: answer.trim(),
    facts: sourceContext.filter(s => s.verificationStatus === "verified"),
    sources: sourceContext,
    confidence: sourceContext.some(s => s.verificationStatus === "verified") ? "high" : "medium",
    requestedBy: userId,
  };
}

export async function intelligentBusinessSearch(input: { query: string; limit?: number }) {
  const query = input.query.trim().toLowerCase();
  if (query.length < 2) throw new Error("Search query must be at least 2 characters");
  const data = await listBusinessData();
  const terms = [...new Set(query.split(/\s+/).filter(Boolean))];
  const scoreText = (text: string) => {
    const haystack = text.toLowerCase();
    return terms.reduce((score, term) => score + (haystack.includes(term) ? (term.length >= 5 ? 3 : 1) : 0), 0);
  };
  const results = [
    ...data.posts.map(item => ({ type: item.type, id: item.id, title: item.title ?? "Untitled", text: item.body, score: scoreText(`${item.title ?? ""} ${item.body} ${item.authorName ?? ""}`) })),
    ...data.opportunities.map(item => ({ type: "opportunity", id: item.id, title: item.title, text: item.description, score: scoreText(`${item.title} ${item.description} ${item.sector} ${item.location ?? ""}`) })),
    ...data.companies.map(item => ({ type: "company", id: item.id, title: item.name, text: item.description ?? "", score: scoreText(`${item.name} ${item.description ?? ""} ${item.industry ?? ""} ${item.location ?? ""}`) })),
  ].filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, input.limit ?? 20);
  return { query: input.query.trim(), results, mode: "hybrid-keyword", aiReady: true };
}

export async function recommendBusinessOpportunities(userId: number, limit = 10) {
  if (!(await isPersonalizedRecommendationsEnabled(userId))) {
    return { recommendations: [], explanation: "Rekomendasi personal dinonaktifkan di pengaturan privasi Anda." };
  }
  const matches = await getOpportunityMatches(userId);
  const top = matches.slice(0, Math.max(1, Math.min(limit, 20)));
  if (!top.length) return { recommendations: [], explanation: "Belum ada peluang yang cukup relevan dengan profil Anda." };
  const profile = await getProfile(userId);
  const explanation = await ask(
    "You are a business recommendation assistant. Explain recommendations using only the supplied profile and opportunity attributes. Do not invent facts. Keep the explanation actionable.",
    `Profile: ${compact(profile, 2000)}
Candidate opportunities: ${compact(top.map(x => ({ id: x.opportunity.id, title: x.opportunity.title, sector: x.opportunity.sector, location: x.opportunity.location, verificationStatus: x.opportunity.verificationStatus, score: x.score, reasons: x.reasons })), 6500)}
Explain why the top opportunities are relevant in 3-5 short bullets.`,
    650
  );
  return { recommendations: top, explanation: explanation.trim() };
}

export async function matchBusinessPartners(userId: number, input: { opportunityId?: number; query?: string; limit?: number }) {
  const data = await listBusinessData();
  const opportunity = input.opportunityId
    ? data.opportunities.find(item => item.id === input.opportunityId)
    : data.opportunities.find(item => `${item.title} ${item.description}`.toLowerCase().includes((input.query ?? "").toLowerCase().trim()));
  if (!opportunity) throw new Error("Opportunity not found");
  const candidates = [];
  for (const company of data.companies) {
    if (company.ownerId !== userId && await canUserDiscover(userId, company.ownerId)) candidates.push(company);
  }
  const terms = `${opportunity.title} ${opportunity.description} ${opportunity.sector} ${opportunity.location ?? ""}`.toLowerCase().split(/\s+/).filter(Boolean);
  const ranked = candidates.map(company => {
    const haystack = `${company.name} ${company.description ?? ""} ${company.industry ?? ""} ${company.location ?? ""}`.toLowerCase();
    const hits = terms.filter(term => term.length > 3 && haystack.includes(term)).length;
    let score = Math.min(95, hits * 12 + (company.verified ? 5 : 0));
    if (opportunity.location && company.location && company.location.toLowerCase().includes(opportunity.location.toLowerCase())) score += 10;
    return { company, score: Math.min(score, 100), reasons: hits ? ["Shared business/industry signals"] : ["Potential strategic fit requiring review"] };
  }).sort((a, b) => b.score - a.score).slice(0, Math.min(input.limit ?? 10, 20));
  return {
    opportunity: { id: opportunity.id, title: opportunity.title, sector: opportunity.sector, location: opportunity.location },
    matches: ranked,
    note: "Match score adalah sinyal awal, bukan jaminan kecocokan. Tinjau profil dan lakukan due diligence sebelum menghubungi pihak lain.",
  };
}
