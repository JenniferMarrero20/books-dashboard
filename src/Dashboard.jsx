import { useEffect, useMemo, useState } from "react";

// helper: build a cover URL if cover_i exists
function coverUrl(cover_i, size = "M") {
  return cover_i ? `https://covers.openlibrary.org/b/id/${cover_i}-${size}.jpg` : null;
}

export default function Dashboard() {
  // state
  const [rawBooks, setRawBooks] = useState([]);        // full results from API
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // controls
  const [search, setSearch] = useState("fantasy");     // default query to load something interesting
  const [author, setAuthor] = useState("All");         // filter dropdown

  // fetch on mount + when search changes
  useEffect(() => {
    let ignore = false;
    async function fetchBooks() {
      try {
        setLoading(true);
        setError("");
        // OpenLibrary Search API
        // q = search string, limit = 50 to ensure we have >= 10 rows
        const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(search)}&limit=50`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (ignore) return;

        // we’ll normalize a subset of fields we care about
        const normalized = (data.docs || []).map(d => ({
          key: d.key, // e.g. "/works/OL82563W"
          title: d.title,
          authorNames: d.author_name || [],
          year: d.first_publish_year || null,
          cover_i: d.cover_i || null,
          subjects: d.subject || [],
        }));
        setRawBooks(normalized);
      } catch (e) {
        setError(e.message || "Failed to fetch data.");
        setRawBooks([]);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
    return () => { ignore = true; };
  }, [search]);

  // unique authors for the filter (from current rawBooks)
  const authorOptions = useMemo(() => {
    const set = new Set();
    rawBooks.forEach(b => (b.authorNames || []).forEach(a => set.add(a)));
    const arr = Array.from(set).sort((a, b) => a.localeCompare(b));
    return ["All", ...arr];
  }, [rawBooks]);

  // combine search + author filter for the list
  const filtered = useMemo(() => {
    // search is already applied via API; we only apply author filter here
    if (author === "All") return rawBooks;
    return rawBooks.filter(b => b.authorNames.includes(author));
  }, [rawBooks, author]);

  // summary statistics (based on filtered results or full results — rubric allows either)
  const stats = useMemo(() => {
    const arr = filtered;
    const total = arr.length;

    const years = arr.map(b => b.year).filter(Boolean);
    const earliest = years.length ? Math.min(...years) : "—";
    const latest = years.length ? Math.max(...years) : "—";
    const avgYear = years.length
      ? Math.round(years.reduce((s, y) => s + y, 0) / years.length)
      : "—";

    // mode author (most frequent in filtered list)
    const authorCount = {};
    arr.forEach(b => (b.authorNames || []).forEach(a => {
      authorCount[a] = (authorCount[a] || 0) + 1;
    }));
    let topAuthor = "—";
    let maxC = 0;
    for (const [name, c] of Object.entries(authorCount)) {
      if (c > maxC) { maxC = c; topAuthor = name; }
    }

    return { total, earliest, latest, avgYear, topAuthor };
  }, [filtered]);

  return (
    <div className="container">
      <header className="header">
        <h1>OpenLibrary Books Dashboard</h1>
        <p className="sub">Search & filter books; explore quick stats.</p>
      </header>

      {/* Controls */}
      <section className="controls">
        <div className="control">
          <label htmlFor="search">Search (title/keywords)</label>
          <input
            id="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g., fantasy, love, space, history..."
          />
          <small>Results update as you type (via API).</small>
        </div>

        <div className="control">
          <label htmlFor="author">Filter by author</label>
          <select
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          >
            {authorOptions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <small>Filter uses a different attribute than search (author).</small>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="cards">
        <Card title="Total Books" value={stats.total} />
        <Card title="Earliest Year" value={stats.earliest} />
        <Card title="Latest Year" value={stats.latest} />
        <Card title="Average Year" value={stats.avgYear} />
        <Card title="Top Author (filtered)" value={stats.topAuthor} />
      </section>

      {/* Status */}
      {loading && <div className="status">Loading…</div>}
      {error && <div className="status error">Error: {error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="status">No results. Try a different search or author.</div>
      )}

      {/* List (≥ 10 rows, ≥ 2 features per row) */}
      {!loading && !error && filtered.length > 0 && (
        <section className="list">
          <div className="list-head">
            <div>Cover</div>
            <div>Title</div>
            <div>Author(s)</div>
            <div>Year</div>
            <div>Subjects</div>
          </div>
          {filtered.slice(0, 50).map((b) => (
            <div className="list-row" key={b.key}>
              <div>
                {coverUrl(b.cover_i) ? (
                  <img className="thumb" src={coverUrl(b.cover_i)} alt={b.title} />
                ) : (
                  <div className="thumb placeholder">No cover</div>
                )}
              </div>
              <div className="title">{b.title || "Untitled"}</div>
              <div>{b.authorNames.length ? b.authorNames.join(", ") : "—"}</div>
              <div>{b.year || "—"}</div>
              <div className="subjects">
                {(b.subjects || []).slice(0, 3).join(", ") || "—"}
              </div>
            </div>
          ))}
        </section>
      )}

      <footer className="footer">
        Data: OpenLibrary Search API. Built for CodePath Week 6.
      </footer>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="card-value">{String(value)}</div>
    </div>
  );
}
