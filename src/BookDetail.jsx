import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

function coverUrl(cover_i, size = "L") {
  return cover_i ? `https://covers.openlibrary.org/b/id/${cover_i}-${size}.jpg` : null;
}

export default function BookDetail() {
  const { workId } = useParams(); // e.g. OL82563W
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
const [author, setAuthor] = useState("All");
const authorOptions = ["All"];

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        // Works API for extra info
        const res = await fetch(`https://openlibrary.org/works/${workId}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const work = await res.json();
        if (ignore) return;
        setData(work);
      } catch (e) {
        setError(e.message || "Failed to load work details");
      } finally {
        setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [workId]);

  return (
    <div className="container">
      <header className="header">
        <h1>OpenLibrary Books Dashboard</h1>
        <p className="sub">Detail view</p>
      </header>
      <section className="controls">
  <div className="control">
    <label htmlFor="search">Search (title/keywords)</label>
    <input
      id="search"
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="e.g., fantasy, love, space, history..."
      disabled
    />
    <small>Results update as you type (disabled on detail view).</small>
  </div>

  <div className="control">
    <label htmlFor="author">Filter by author</label>
    <select
      id="author"
      value={author}
      onChange={(e) => setAuthor(e.target.value)}
      disabled
    >
      {authorOptions.map(a => <option key={a} value={a}>{a}</option>)}
    </select>
    <small>Filter uses a different attribute than search (disabled here).</small>
  </div>
</section>


      <Link to=".." style={{ textDecoration: "none", color: "#4f46e5" }}>← Back to results</Link>

      {loading && <div className="status">Loading…</div>}
      {error && <div className="status error">Error: {error}</div>}

      {data && (
        <section className="list" style={{ padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>{data.title || "Untitled"}</h2>

          <p><strong>Description:</strong><br />
            {typeof data.description === "string"
              ? data.description
              : data.description?.value || "—"}
          </p>

          <p><strong>Subjects:</strong><br />
            {(data.subjects || []).slice(0, 15).join(", ") || "—"}
          </p>

          <p><strong>Excerpts:</strong><br />
            {(data.excerpts || []).length
              ? data.excerpts.map((ex, i) => <em key={i} style={{ display: "block", margin: "6px 0" }}>{ex?.excerpt}</em>)
              : "—"}
          </p>

          <p style={{ color: "#64748b", fontSize: 12, marginTop: 12 }}>
            Source: OpenLibrary Works API /works/{workId}.json
          </p>
        </section>
      )}
    </div>
  );
}
