import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let tag = document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setCanonical(url: string) {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;
}

export default function PublicEditorial({ type }: { type: "news" | "article" }) {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const query = trpc.business.publicEditorial.useQuery({ id }, { enabled: Number.isInteger(id) && id > 0 });
  const item = query.data;

  useEffect(() => {
    if (!item) return;
    const label = type === "news" ? "News" : "Article";
    const title = item.title || `BusinessNotes ${label}`;
    const description = item.body.slice(0, 160).replace(/\s+/g, " ");
    const canonical = `${window.location.origin}/${type}/${item.id}`;
    document.title = `${title} · BusinessNotes`;
    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", "article", "property");
    setMeta("og:url", canonical, "property");
    setMeta("twitter:card", "summary");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setCanonical(canonical);

    let jsonLd = document.getElementById("businessnotes-editorial-jsonld") as HTMLScriptElement | null;
    if (!jsonLd) {
      jsonLd = document.createElement("script");
      jsonLd.id = "businessnotes-editorial-jsonld";
      jsonLd.type = "application/ld+json";
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": type === "news" ? "NewsArticle" : "Article",
      headline: title,
      description,
      datePublished: item.publishedAt,
      author: { "@type": "Person", name: item.authorName || "BusinessNotes member" },
      mainEntityOfPage: canonical,
    });
    return () => { jsonLd?.remove(); };
  }, [item, type]);

  if (query.isLoading) return <main className="mx-auto max-w-3xl px-5 py-16 text-sm text-[#66818a]">Loading…</main>;
  if (query.isError || !item) return <main className="mx-auto max-w-3xl px-5 py-16"><h1 className="text-2xl font-extrabold text-[#173b59]">Content not found</h1><Link href="/" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#2b796d]"><ArrowLeft size={15}/> Back to BusinessNotes</Link></main>;

  return <main className="min-h-screen bg-[#fbfbf9] px-5 py-10 sm:px-8">
    <article className="mx-auto max-w-3xl rounded-[24px] border border-[#e1e9e5] bg-white p-6 shadow-[0_16px_50px_rgba(35,51,63,0.07)] sm:p-10">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#66818a] hover:text-[#2b796d]"><ArrowLeft size={14}/> BusinessNotes</Link>
      <div className="mt-8 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#2b9a8b]"><span>{type === "news" ? "News" : "Article"}</span>{item.verificationStatus === "verified" && <span className="inline-flex items-center gap-1"><ShieldCheck size={13}/> Verified</span>}</div>
      <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[#173b59] sm:text-4xl">{item.title}</h1>
      <p className="mt-3 text-xs text-[#819198]">By {item.authorName || "BusinessNotes member"} · {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : ""}</p>
      <div className="mt-8 whitespace-pre-wrap text-[15px] leading-7 text-[#4e6972]">{item.body}</div>
      {item.source && <a href={item.source} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#eff8f5] px-4 py-2 text-xs font-extrabold text-[#277568]"><ExternalLink size={13}/> Source</a>}
    </article>
  </main>;
}
