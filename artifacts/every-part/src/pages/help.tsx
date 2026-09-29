import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { HELP_SECTIONS, type HelpArticle } from "@/help/articles";

const allArticles = HELP_SECTIONS.flatMap((section) => section.articles);
const articleBySlug = new Map(allArticles.map((article) => [article.slug, article]));

function articlePath(slug: string) {
  return `/help/${encodeURIComponent(slug)}`;
}

function plainText(markdown: string) {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/[#*_`>~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function preview(article: HelpArticle, query?: string) {
  const text = plainText(article.content);
  const position = query ? text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase()) : -1;
  const start = Math.max(0, position - 54);
  return `${start ? "…" : ""}${text.slice(start, start + 160)}${text.length > start + 160 ? "…" : ""}`;
}

function headingText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(headingText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return headingText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function headingId(children: ReactNode) {
  return headingText(children)
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Keep Markdown navigation inside Help for relative article links. Reject unsafe schemes. */
function safeLink(href: string, currentSlug: string) {
  if (!href) return null;
  if (href.startsWith("#")) return { href, internal: true };
  if (/^(https?:\/\/|mailto:)/i.test(href)) return { href, internal: false };
  if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith("//")) return null;

  const [path, suffix = ""] = href.split(/(?=[?#])/);
  const ending = suffix ? href.slice(path.length) : "";
  if (!path) return { href: ending || "#", internal: true };
  if (path.startsWith("/") && !path.startsWith("/help/") && path !== "/help") {
    return { href: path + ending, internal: true };
  }
  if (path === "/help") return { href: path + ending, internal: true };

  const filename = path.split("/").filter(Boolean).pop() || currentSlug;
  const slug = filename.replace(/\.md(?:own)?$/i, "");
  if (articleBySlug.has(slug)) return { href: articlePath(slug) + ending, internal: true };
  if (path.startsWith("/help/")) return { href: path + ending, internal: true };
  return null;
}

function ArticleMarkdown({ article }: { article: HelpArticle }) {
  const headingClass = "scroll-mt-24 font-serif font-semibold tracking-tight text-foreground";
  return (
    <div className="max-w-none text-[15px] leading-[1.85] text-foreground/85 sm:text-base">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h2 id={headingId(children)} className={`${headingClass} mb-4 mt-10 text-2xl sm:text-3xl`}>{children}</h2>,
          h2: ({ children }) => <h2 id={headingId(children)} className={`${headingClass} mb-4 mt-10 text-2xl sm:text-3xl`}>{children}</h2>,
          h3: ({ children }) => <h3 id={headingId(children)} className={`${headingClass} mb-3 mt-8 text-xl`}>{children}</h3>,
          h4: ({ children }) => <h4 id={headingId(children)} className={`${headingClass} mb-2 mt-6 text-lg`}>{children}</h4>,
          p: ({ children }) => <p className="mb-5">{children}</p>,
          ul: ({ children }) => <ul className="mb-6 list-disc space-y-2 pl-6 marker:text-accent">{children}</ul>,
          ol: ({ children }) => <ol className="mb-6 list-decimal space-y-2 pl-6 marker:text-accent">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
          blockquote: ({ children }) => <blockquote className="my-7 border-l-[3px] border-accent bg-secondary/10 px-5 py-4 text-foreground [&>p:last-child]:mb-0">{children}</blockquote>,
          hr: () => <hr className="my-10 border-border" />,
          code: ({ children, className }) => className
            ? <code className={className}>{children}</code>
            : <code className="rounded bg-muted px-1.5 py-0.5 text-[.9em] text-foreground">{children}</code>,
          pre: ({ children }) => <pre className="mb-6 overflow-x-auto rounded-xl bg-primary p-5 text-sm leading-relaxed text-primary-foreground">{children}</pre>,
          table: ({ children }) => <div className="mb-6 overflow-x-auto"><table className="w-full min-w-[440px] border-collapse text-left text-sm">{children}</table></div>,
          th: ({ children }) => <th className="border-b border-border bg-muted/60 px-3 py-2 font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-b border-border px-3 py-2 align-top">{children}</td>,
          a: ({ href, children }) => {
            const destination = safeLink(href || "", article.slug);
            if (!destination) return <span>{children}</span>;
            const linkClass = "font-semibold text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-2";
            if (destination.internal && !destination.href.startsWith("#")) {
              return <Link href={destination.href} className={linkClass}>{children}</Link>;
            }
            return <a href={destination.href} className={linkClass} {...(!destination.internal ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{children}</a>;
          },
        }}
      >
        {article.content}
      </ReactMarkdown>
    </div>
  );
}

function ArticleSidebar({ selectedSlug }: { selectedSlug: string }) {
  return (
    <aside className="order-2 self-start rounded-2xl border border-border/70 bg-card/70 p-5 lg:order-1 lg:sticky lg:top-24 lg:p-6" aria-label="Help topics">
      <p className="mb-5 text-xs font-bold uppercase tracking-[.18em] text-accent">Browse the guide</p>
      <nav aria-label="Help articles" className="space-y-5">
        {HELP_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="mb-2 text-sm font-bold text-foreground">{section.title}</p>
            <ul className="space-y-0.5 border-l border-border/80">
              {section.articles.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={articlePath(item.slug)}
                    aria-current={selectedSlug === item.slug ? "page" : undefined}
                    data-testid={`link-help-nav-${item.slug}`}
                    className={`block rounded-r-lg border-l-2 py-1.5 pl-3 pr-2 text-sm leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${selectedSlug === item.slug ? "border-accent bg-accent/10 font-semibold text-foreground" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default function HelpPage() {
  const [location, navigate] = useLocation();
  const rawSlug = location.split(/[?#]/)[0].replace(/\/+$/, "").replace(/^\/help\/?/, "");
  let slug = "";
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    slug = rawSlug;
  }
  const isIndex = !rawSlug;
  const article = articleBySlug.get(slug);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeResult, setActiveResult] = useState(-1);
  const normalized = query.trim().toLocaleLowerCase();
  const results = useMemo(() => {
    if (!normalized) return [];
    const terms = normalized.split(/\s+/);
    return allArticles
      .map((item) => {
        const title = item.title.toLocaleLowerCase();
        const body = plainText(item.content).toLocaleLowerCase();
        const section = item.section.toLocaleLowerCase();
        const matches = terms.every((term) => title.includes(term) || body.includes(term) || section.includes(term));
        return { item, score: matches ? terms.reduce((total, term) => total + (title.includes(term) ? 3 : 0) + (section.includes(term) ? 1 : 0), 0) : -1 };
      })
      .filter(({ score }) => score >= 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  }, [normalized]);

  useEffect(() => {
    if (!article) return;
    setQuery("");
    setActiveResult(-1);
    const frame = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [article?.slug]);

  useEffect(() => {
    const previous = document.title;
    document.title = article
      ? `${article.title} | Help Center | Every Part`
      : "Help Center | Every Part";
    return () => { document.title = previous; };
  }, [article?.slug]);

  useEffect(() => {
    if (activeResult >= 0) {
      document.getElementById(`help-result-${activeResult}`)?.scrollIntoView({ block: "nearest" });
    }
  }, [activeResult]);

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setQuery("");
      setActiveResult(-1);
      event.preventDefault();
    } else if (event.key === "ArrowDown" && results.length) {
      setActiveResult((current) => (current + 1) % results.length);
      event.preventDefault();
    } else if (event.key === "ArrowUp" && results.length) {
      setActiveResult((current) => (current <= 0 ? results.length - 1 : current - 1));
      event.preventDefault();
    } else if (event.key === "Enter" && results.length) {
      navigate(articlePath(results[activeResult < 0 ? 0 : activeResult].slug));
      setQuery("");
      setActiveResult(-1);
      event.preventDefault();
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background">
       <div className="container mx-auto max-w-7xl px-4 pb-36 pt-7 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" data-testid="link-help-dashboard" className="rounded-sm hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">Dashboard</Link>
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          {isIndex ? (
            <span aria-current="page" className="font-medium text-foreground">Help Center</span>
          ) : (
            <>
              <Link href="/help" data-testid="link-help-breadcrumb" className="rounded-sm hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">Help Center</Link>
              <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
              <span aria-current="page" className="max-w-[240px] truncate font-medium text-foreground sm:max-w-none">{article?.title || "Article not found"}</span>
            </>
          )}
        </nav>

        {isIndex ? (
          <>
             <section className="relative overflow-hidden rounded-[1.75rem] bg-primary px-6 py-7 text-primary-foreground sm:px-10 sm:py-14 lg:px-14 lg:py-16">
              <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full border border-primary-foreground/10 sm:right-0" />
              <div aria-hidden="true" className="pointer-events-none absolute -right-10 top-12 h-72 w-72 rounded-full border border-primary-foreground/10" />
              <div className="relative max-w-3xl">
                 <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-secondary sm:mb-5">
                  <BookOpen aria-hidden="true" className="h-4 w-4" /> A guide for church leaders
                </div>
                <h1 className="max-w-2xl font-serif text-4xl font-semibold leading-[1.08] tracking-[-.045em] sm:text-5xl lg:text-6xl">Help Center</h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-primary-foreground/80 sm:text-lg">Practical answers for guiding people toward a place to serve. Find what you need and get back to your ministry.</p>
                 <div className="relative mt-6 max-w-2xl sm:mt-8">
                  <label htmlFor="help-search" className="mb-2 block text-sm font-semibold text-primary-foreground">Search the guide</label>
                  <div className="relative">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      ref={searchRef}
                      id="help-search"
                      type="search"
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={Boolean(normalized)}
                      aria-controls="help-search-results"
                      aria-activedescendant={activeResult >= 0 && normalized ? `help-result-${activeResult}` : undefined}
                      aria-describedby="help-search-hint"
                      autoComplete="off"
                      data-testid="input-help-search"
                      placeholder="Search topics or a question"
                      value={query}
                      onChange={(event) => { setQuery(event.target.value); setActiveResult(-1); }}
                      onKeyDown={onSearchKeyDown}
                      className="h-14 w-full rounded-xl border border-transparent bg-background py-3 pl-12 pr-12 text-base text-foreground shadow-lg shadow-primary/10 outline-none placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
                    />
                    {query && <button type="button" aria-label="Clear search" data-testid="button-clear-help-search" onClick={() => { setQuery(""); setActiveResult(-1); searchRef.current?.focus(); }} className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"><X className="h-4 w-4" /></button>}
                  </div>
                  <p id="help-search-hint" className="mt-2 text-xs text-primary-foreground/65">Use the arrow keys to explore results, Enter to open, or Escape to clear.</p>
                </div>
              </div>
            </section>

            <div className="mt-10 sm:mt-12">
              {normalized ? (
                <section aria-labelledby="search-heading">
                  <div className="mb-5 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Search the guide</p>
                      <h2 id="search-heading" className="mt-1 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Results for “{query.trim()}”</h2>
                    </div>
                    <p role="status" data-testid="status-help-results" className="text-sm text-muted-foreground">{results.length} {results.length === 1 ? "article" : "articles"} found</p>
                  </div>
                  <div id="help-search-results" role="listbox" aria-label="Help search results" className="space-y-2">
                    {results.length ? results.map((item, index) => (
                      <Link
                        key={item.slug}
                        id={`help-result-${index}`}
                        href={articlePath(item.slug)}
                        role="option"
                        aria-selected={activeResult === index}
                        data-testid={`link-help-result-${item.slug}`}
                        onMouseEnter={() => setActiveResult(index)}
                        className={`group flex items-start gap-4 rounded-2xl border px-5 py-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${activeResult === index ? "border-accent bg-secondary/15" : "border-border/70 bg-card hover:border-accent/50 hover:bg-secondary/10"}`}
                      >
                        <BookOpen aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-accent" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold uppercase tracking-[.12em] text-accent">{item.section}</span>
                          <span className="mt-1 block font-serif text-lg font-semibold text-foreground">{item.title}</span>
                          <span className="mt-1 block line-clamp-2 text-sm leading-relaxed text-muted-foreground">{preview(item, normalized)}</span>
                        </span>
                        <ArrowRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                      </Link>
                    )) : (
                      <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center" role="status" data-testid="status-help-no-results">
                        <Search aria-hidden="true" className="mx-auto h-7 w-7 text-accent" />
                        <h3 className="mt-4 font-serif text-xl font-semibold">No articles found</h3>
                        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">Try a shorter phrase or a different ministry topic. Clear the search to browse all sections.</p>
                        <button type="button" data-testid="button-show-help-sections" className="mt-5 inline-flex items-center gap-2 rounded-lg font-semibold text-accent underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => { setQuery(""); searchRef.current?.focus(); }}>Browse all sections <ArrowRight className="h-4 w-4" /></button>
                      </div>
                    )}
                  </div>
                </section>
              ) : (
                <section aria-labelledby="topics-heading">
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">The guide</p>
                       <h2 id="topics-heading" className="mt-1 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Browse by topic</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">{HELP_SECTIONS.length} sections · {allArticles.length} articles</p>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                    {HELP_SECTIONS.map((section, index) => (
                      <section key={section.title} aria-labelledby={`help-section-${index}`} className="grid gap-5 border-b border-border/70 px-5 py-7 last:border-b-0 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-12">
                        <div className="flex items-start gap-4">
                          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/20 font-serif text-sm font-semibold text-accent">{String(index + 1).padStart(2, "0")}</span>
                          <div>
                            <h2 id={`help-section-${index}`} className="font-serif text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{section.title}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">{section.articles.length} {section.articles.length === 1 ? "article" : "articles"}</p>
                          </div>
                        </div>
                        <ul className="divide-y divide-border/60 border-t border-border/60 lg:border-t-0">
                          {section.articles.map((item) => (
                            <li key={item.slug}>
                              <Link href={articlePath(item.slug)} data-testid={`link-help-article-${item.slug}`} className="group flex items-center justify-between gap-4 rounded-md py-3 text-sm font-medium leading-snug text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2">
                                <span>{item.title}</span>
                                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        ) : article ? (
          <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[280px_minmax(0,1fr)]">
            <ArticleSidebar selectedSlug={article.slug} />
            <article className="order-1 min-w-0 lg:order-2" aria-labelledby="help-article-title">
              <div className="mb-8 border-b border-border/80 pb-8 sm:mb-10">
                <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-accent">{article.section}</p>
                <h1 ref={titleRef} tabIndex={-1} id="help-article-title" data-testid="heading-help-article" className="max-w-3xl rounded-sm font-serif text-3xl font-semibold leading-[1.14] tracking-[-.04em] outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-4xl lg:text-5xl">{article.title}</h1>
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><BookOpen aria-hidden="true" className="h-4 w-4" /> Every Part leader guide</p>
              </div>
              <ArticleMarkdown article={article} />
              <div className="mt-12 border-t border-border pt-6">
                <Link href="/help" data-testid="link-help-all-topics" className="group inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"><ArrowLeft aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> All help topics</Link>
              </div>
            </article>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card px-6 py-12 text-center sm:px-12 sm:py-16" data-testid="status-help-article-not-found">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/20 text-accent"><BookOpen aria-hidden="true" className="h-6 w-6" /></div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-accent">Help Center</p>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">We couldn’t find that article.</h1>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-foreground">The link may have changed. Browse the guide to find the answer you need.</p>
            <Link href="/help" data-testid="link-help-from-not-found" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"><ArrowLeft className="h-4 w-4" /> Back to Help Center</Link>
          </div>
        )}
      </div>
    </div>
  );
}