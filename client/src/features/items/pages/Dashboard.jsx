import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useItem from "../hooks/useItem.js";
import { setActiveFilter, setView, setSelectedItem, setSurfaced, setSearchQuery } from '../../../app/slices/uiSlice';
import { setItems } from '../../../app/slices/itemsSlice';
import { logout } from '../../../features/auth/service/auth.api.js';



// const items = [
//   {
//     id: 1, type: "article", title: "The Future of AI in Knowledge Work",
//     source: "medium.com", tags: ["AI", "Productivity", "Future"],
//     time: "2 months ago", color: "#6EE7B7", related: [2, 4],
//     preview: "How artificial intelligence is transforming the way we process and retain information at scale.",
//     icon: "📄",
//   },
//   {
//     id: 2, type: "tweet", title: "Thread: Why second brains are the new superpower",
//     source: "twitter.com", tags: ["PKM", "Learning"],
//     time: "3 weeks ago", color: "#93C5FD", related: [1, 3],
//     preview: "1/ The people who will thrive in the next decade aren't the ones with the best memory...",
//     icon: "🐦",
//   },
//   {
//     id: 3, type: "video", title: "Building a Knowledge Graph from Scratch",
//     source: "youtube.com", tags: ["Knowledge Graph", "Dev", "AI"],
//     time: "1 month ago", color: "#FCA5A5", related: [2, 5],
//     preview: "Step-by-step tutorial on creating semantic connections between ideas using vector embeddings.",
//     icon: "▶️",
//   },
//   {
//     id: 4, type: "pdf", title: "Cognitive Load & Information Architecture",
//     source: "research.pdf", tags: ["Cognition", "UX", "Research"],
//     time: "5 days ago", color: "#FCD34D", related: [1, 6],
//     preview: "A deep dive into how humans process information and the implications for digital tool design.",
//     icon: "📕",
//   },
//   {
//     id: 5, type: "image", title: "Knowledge Graph Visualization — Roam",
//     source: "roamresearch.com", tags: ["PKM", "Visualization"],
//     time: "Yesterday", color: "#C4B5FD", related: [3, 6],
//     preview: "Screenshot of a 2000-node knowledge graph showing emergent clusters and connection density.",
//     icon: "🖼️",
//   },
//   {
//     id: 6, type: "article", title: "Spaced Repetition: The Scientific Method for Memory",
//     source: "gwern.net", tags: ["Memory", "Learning", "Science"],
//     time: "4 months ago", color: "#6EE7B7", related: [4, 5],
//     preview: "Why our brains forget and how algorithmic spacing can make anything stick permanently.",
//     icon: "📄",
//   },
// ];

const typeFilters = ["All", "article", "tweet", "video", "pdf", "image"];

const typeIcon = { article: "📄", tweet: "🐦", video: "▶️", pdf: "📕", image: "🖼️" };

export default function Dashboard() {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { fetchItems, searchForItems, createNewItem } = useItem();
  
  const items = useSelector(state => state.items.list);
  const activeFilter = useSelector(state => state.ui.activeFilter);
  const searchQuery = useSelector(state => state.ui.searchQuery);
  const view = useSelector(state => state.ui.view);
  const selectedItem = useSelector(state => state.ui.selectedItem);
  const surfaced = useSelector(state => state.ui.surfaced);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("Links");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Pick a random resurfaced item on load
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchItems();
        const itemsList = data?.items || [];
        dispatch(setItems(itemsList));

        const oldItems = itemsList.filter(i =>
          i.createdAt && new Date(i.createdAt) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        );
        dispatch(setSurfaced(oldItems.length > 0 ? oldItems[Math.floor(Math.random() * oldItems.length)] : null));

      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fetchItems, dispatch]);

  // Memory Resurfacing Logic from snippet
  useEffect(() => {
    if (items.length > 0) {
      const oldItems = items.filter(i => i.time && i.time.includes('month'));
      if (oldItems.length > 0) {
        dispatch(setSurfaced(oldItems[0]));
      }
    }
  }, [items, dispatch]);

  // Filter items based on active filter and search query
  const filtered = items.filter(item => {
    const matchType = activeFilter === "All" || item.type === activeFilter;
    const matchSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchType && matchSearch;
  });

  // Knowledge graph canvas animation
  useEffect(() => {
    if (view !== "graph") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const radius = Math.min(W, H) * 0.33;
    let t = 0;

    const positions = items.map((_, i) => {
      const angle = (i / items.length) * Math.PI * 2;
      return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
    });

    function draw() {
      ctx.clearRect(0, 0, W, H);
      t += 0.005;

      // Edges
      items.forEach((item, i) => {
        (item.related || []).forEach(rid => {
          const j = items.findIndex(x => x.id === rid);
          if (j < 0) return;
          const p1 = positions[i];
          const p2 = positions[j];
          const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          grad.addColorStop(0, item.color + "88");
          grad.addColorStop(1, items[j].color + "88");
          ctx.beginPath();
          ctx.moveTo(p1.x + Math.sin(t + i) * 4, p1.y + Math.cos(t + i) * 4);
          ctx.lineTo(p2.x + Math.sin(t + j) * 4, p2.y + Math.cos(t + j) * 4);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      });

      // Center node
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#0a0a0f";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("YOU", cx, cy);

      // Center spokes
      items.forEach((item, i) => {
        const p = positions[i];
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(p.x + Math.sin(t + i) * 4, p.y + Math.cos(t + i) * 4);
        ctx.strokeStyle = "#ffffff18";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Nodes
      items.forEach((item, i) => {
        const itemColor = item.color || "#6EE7B7";
        const nx = positions[i].x + Math.sin(t + i) * 4;
        const ny = positions[i].y + Math.cos(t + i) * 4;
        ctx.beginPath();
        ctx.arc(nx, ny, 22, 0, Math.PI * 2);
        ctx.fillStyle = itemColor + "22";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(nx, ny, 14, 0, Math.PI * 2);
        ctx.fillStyle = itemColor;
        ctx.shadowColor = itemColor;
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#000";
        ctx.font = "11px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(typeIcon[item.type] || "📄", nx, ny);
        ctx.fillStyle = "#ffffffcc";
        ctx.font = "10px monospace";
        ctx.fillText((item.title || "").slice(0, 14) + "…", nx, ny + 26);
      });

      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [view]);

  useEffect(() => {
    if (!searchQuery) return;
    const search = async () => {
      try {
        const results = await searchForItems(searchQuery);
        dispatch(setItems(results || []));
      } catch (err) {
        console.error("Search failed:", err);
      }
    };
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, searchForItems, dispatch]);

  async function handleSave() {
    if (!urlInput) return;
    setSaving(true);
    try {
      // Create the item on the server
      const payload = {
        title: urlInput,
        url: urlInput,
        type: "article",
        category: categoryInput
      };
      const res = await createNewItem(payload);
      const newItem = res?.item;
      if (newItem) {
        // Prepend the newly created item to the list in the store
        dispatch(setItems([newItem, ...items]));
        setSaved(true);
      }
    } catch (err) {
      console.error('Create item failed:', err);
    } finally {
      setSaving(false);
      setTimeout(() => { setSaved(false); setUrlInput(""); setAddOpen(false); }, 1200);
    }
  }

  return (
    <div style={{ fontFamily: "'Syne', sans-serif", background: "#080810", minHeight: "100vh", color: "#e8e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0f0f1a; }
        ::-webkit-scrollbar-thumb { background: #2a2a3f; border-radius: 2px; }
        body { background: #080810; }
        .card { transition: transform 0.22s ease, box-shadow 0.22s ease; }
        .card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.5); }
        .tag { font-family: 'JetBrains Mono', monospace; font-size: 10px; padding: 2px 8px; border-radius: 20px; }
        .filter-btn { font-family: 'JetBrains Mono', monospace; font-size: 11px; cursor: pointer; transition: all 0.15s; border: none; }
        .filter-btn:hover { opacity: 0.85; }
        .glow-btn { transition: all 0.2s; }
        .glow-btn:hover { box-shadow: 0 0 24px currentColor; }
        input { outline: none; }
        textarea { outline: none; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        .surfaced-card { animation: fadeUp 0.6s ease forwards; }
        .saving-shimmer { background: linear-gradient(90deg, #1a1a2e 25%, #2a2a4e 50%, #1a1a2e 75%); background-size: 400px; animation: shimmer 1.2s infinite; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); z-index: 100; display: flex; align-items: center; justify-content: center; }
      `}</style>

      {/* Ambient background blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, #6EE7B722 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #93C5FD18 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "40%", left: "40%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, #C4B5FD10 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <header style={{ borderBottom: "1px solid #1e1e30", padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#09090f" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #6EE7B7, #93C5FD)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 0 20px #6EE7B744" }}>🧠</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px", color: "#fff" }}>SavedMind</div>
              <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#555570", letterSpacing: "0.1em" }}>YOUR SECOND BRAIN</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#12121e", border: "1px solid #1e1e30", borderRadius: 10, padding: "8px 14px", width: 240 }}>
              <span style={{ fontSize: 14, opacity: 0.4 }}>⌕</span>
              <input value={searchQuery} onChange={e => dispatch(setSearchQuery(e.target.value))} placeholder="Search your mind..." style={{ background: "none", border: "none", color: "#e8e8f0", fontSize: 13, fontFamily: "'Syne'", width: "100%" }} />
            </div>
            {/* View toggle */}
            <div style={{ display: "flex", background: "#12121e", border: "1px solid #1e1e30", borderRadius: 10, overflow: "hidden" }}>
              {[["grid", "⊞"], ["graph", "◎"]].map(([v, icon]) => (
                <button key={v} onClick={() => dispatch(setView(v))} className="filter-btn" style={{ padding: "8px 16px", background: view === v ? "#1e1e30" : "none", color: view === v ? "#6EE7B7" : "#555570", fontSize: 16 }}>{icon}</button>
              ))}
            </div>
            {/* Add button */}
            <button onClick={() => setAddOpen(true)} className="glow-btn" style={{ color: "#6EE7B7", background: "#6EE7B718", border: "1px solid #6EE7B740", borderRadius: 10, padding: "8px 18px", fontFamily: "'Syne'", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>+</span> Save
            </button>
            {/* Logout button */}
            <button onClick={handleLogout} className="glow-btn" style={{ color: "#FF6B6B", background: "#FF6B6B18", border: "1px solid #FF6B6B40", borderRadius: 10, padding: "8px 18px", fontFamily: "'Syne'", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>🚪</span> Logout
            </button>
          </div>
        </header>

        <div style={{ display: "flex", minHeight: "calc(100vh - 65px)" }}>
          {/* Sidebar */}
          <aside style={{ width: 220, borderRight: "1px solid #1e1e30", padding: "28px 20px", display: "flex", flexDirection: "column", gap: 6, background: "#09090f", flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#333350", letterSpacing: "0.12em", marginBottom: 10 }}>COLLECTIONS</div>
            {[
              { label: "All Saves", icon: "◈", count: 6 },
              { label: "AI & Tech", icon: "◆", count: 3 },
              { label: "Learning", icon: "◇", count: 2 },
              { label: "Research", icon: "○", count: 1 },
            ].map(({ label, icon, count }) => (
              <button key={label} className="filter-btn" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, background: label === "All Saves" ? "#1a1a28" : "none", color: label === "All Saves" ? "#e8e8f0" : "#555570", width: "100%", textAlign: "left", fontSize: 13, fontFamily: "'Syne'" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span>{icon}</span>{label}</span>
                <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#333350" }}>{count}</span>
              </button>
            ))}

            <div style={{ borderTop: "1px solid #1e1e30", marginTop: 16, paddingTop: 16, fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#333350", letterSpacing: "0.12em", marginBottom: 10 }}>TOPICS</div>
            {["AI", "PKM", "Learning", "Design", "Research"].map(tag => (
              <button key={tag} className="filter-btn" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "none", color: "#555570", width: "100%", textAlign: "left", fontSize: 12, fontFamily: "'JetBrains Mono'" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2a2a3f", display: "inline-block" }} />#{tag}
              </button>
            ))}

            <div style={{ marginTop: "auto", padding: "16px 12px", background: "#0f0f1e", border: "1px solid #1e1e30", borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", color: "#555570", marginBottom: 6 }}>Storage</div>
              <div style={{ height: 4, background: "#1a1a28", borderRadius: 2 }}>
                <div style={{ height: "100%", width: "38%", background: "linear-gradient(90deg, #6EE7B7, #93C5FD)", borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#333350", marginTop: 4 }}>38 / 100 items</div>
            </div>
          </aside>

          {/* Main */}
          <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
            {surfaced && (() => {
              const surfacedColor = surfaced.color || "#6EE7B7";
              const surfacedIcon = surfaced.icon || typeIcon[surfaced.type] || "📄";
              const surfacedPreview = surfaced.preview || surfaced.metadata?.description || surfaced.content || "";
              const surfacedTime = surfaced.time || new Date(surfaced.createdAt || Date.now()).toLocaleDateString();

              return (
              <div className="surfaced-card" style={{ background: "linear-gradient(135deg, #12121e, #1a1a2e)", border: "1px solid #2a2a3f", borderRadius: 14, padding: "16px 20px", marginBottom: 28, display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }} onClick={() => dispatch(setSelectedItem(surfaced))}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: surfacedColor + "20", border: "1px solid " + surfacedColor + "40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{surfacedIcon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#6EE7B7", letterSpacing: "0.1em", marginBottom: 4 }}>🔁 MEMORY RESURFACING · {surfacedTime.toUpperCase()}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e8e8f0" }}>{surfaced.title}</div>
                  <div style={{ fontSize: 12, color: "#555570", marginTop: 3, fontFamily: "'JetBrains Mono'" }}>{surfacedPreview.slice(0, 80)}…</div>
                </div>
                <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#333350", padding: "6px 12px", border: "1px solid #1e1e30", borderRadius: 20 }}>REVISIT →</div>
              </div>
            )})()}

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {typeFilters.map(f => (
                <button key={f} onClick={() => dispatch(setActiveFilter(f))} className="filter-btn" style={{ padding: "6px 16px", borderRadius: 20, background: activeFilter === f ? "#6EE7B7" : "#12121e", color: activeFilter === f ? "#080810" : "#555570", border: activeFilter === f ? "none" : "1px solid #1e1e30", fontWeight: activeFilter === f ? 700 : 400 }}>
                  {f === "All" ? f : `${typeIcon[f]} ${f}`}
                </button>
              ))}
              <div style={{ marginLeft: "auto", fontSize: 11, fontFamily: "'JetBrains Mono'", color: "#333350", display: "flex", alignItems: "center" }}>{filtered.length} items</div>
            </div>

            {loading && (
  <div style={{ textAlign: "center", padding: "40px", color: "#555570" }}>
    <div style={{ fontSize: 14 }}>Loading your items...</div>
  </div>
)}
{error && (
  <div style={{ padding: "16px", background: "#FCA5A533", border: "1px solid #FCA5A5", borderRadius: 10, color: "#FCA5A5", marginBottom: 24 }}>
    Error loading items: {error}
  </div>
)}

      {!loading && !error && (
        <>

            {/* Graph view */}
            {view === "graph" && (
              <div className="fade-up" style={{ background: "#0c0c18", border: "1px solid #1e1e30", borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e1e30", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#e8e8f0" }}>Knowledge Graph</span>
                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#333350" }}>6 nodes · 8 connections</span>
                </div>
                <canvas ref={canvasRef} style={{ width: "100%", height: 420, display: "block" }} />
              </div>
            )}

            {/* Grid view */}
            {view === "grid" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {filtered.map((item, idx) => {
                  const itemColor = item.color || "#6EE7B7";
                  const itemIcon = item.icon || typeIcon[item.type] || "📄";
                  const itemPreview = item.preview || item.metadata?.description || item.content || "";
                  const itemSource = item.source || item.metadata?.siteName || "Web";
                  const itemTime = item.time || new Date(item.createdAt || Date.now()).toLocaleDateString();
                  
                  return (
                  <div key={item._id || item.id} className="card fade-up" onClick={() => dispatch(setSelectedItem(item))} style={{ background: "#0f0f1a", border: "1px solid #1e1e30", borderRadius: 14, padding: "18px", cursor: "pointer", animationDelay: `${idx * 60}ms`, position: "relative", overflow: "hidden" }}>
                    {/* Color accent top */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${itemColor}, transparent)` }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: itemColor + "18", border: "1px solid " + itemColor + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{itemIcon}</div>
                      <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#333350" }}>{itemTime}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e8e8f0", marginBottom: 8, lineHeight: 1.4 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#444460", fontFamily: "'JetBrains Mono'", marginBottom: 12, lineHeight: 1.5 }}>{itemPreview.slice(0, 90)}…</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(item.tags || []).map(tag => (
                        <span key={tag} className="tag" style={{ background: "#1a1a2a", color: "#555570", border: "1px solid #1e1e30" }}>#{tag}</span>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1e1e30", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#333350" }}>{itemSource}</span>
                      <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: itemColor, background: itemColor + "15", padding: "3px 8px", borderRadius: 20 }}>{(item.related || []).length} related</span>
                    </div>
                  </div>
                )})}
              </div>
            )}
          
          </>
      )}
      </main>

          {/* Detail Drawer */}
          {selectedItem && (() => {
            const itemColor = selectedItem.color || "#6EE7B7";
            const itemIcon = selectedItem.icon || typeIcon[selectedItem.type] || "📄";
            const itemPreview = selectedItem.preview || selectedItem.metadata?.description || selectedItem.content || "";
            const itemSource = selectedItem.source || selectedItem.metadata?.siteName || "Web";
            const itemTime = selectedItem.time || new Date(selectedItem.createdAt || Date.now()).toLocaleDateString();

            return (
            <aside style={{ width: 340, borderLeft: "1px solid #1e1e30", background: "#09090f", overflowY: "auto", animation: "fadeUp 0.25s ease" }}>
              <div style={{ padding: "18px 20px", borderBottom: "1px solid #1e1e30", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono'", color: "#555570", textTransform: "uppercase" }}>Detail</span>
                <button onClick={() => dispatch(setSelectedItem(null))} style={{ background: "none", border: "none", color: "#555570", cursor: "pointer", fontSize: 18 }}>✕</button>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: itemColor + "18", border: "1px solid " + itemColor + "40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 }}>{itemIcon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#e8e8f0", lineHeight: 1.4, marginBottom: 8 }}>{selectedItem.title}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#333350" }}>{itemSource}</span>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#333350" }} />
                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#333350" }}>{itemTime}</span>
                </div>
                <div style={{ fontSize: 13, color: "#666680", lineHeight: 1.7, marginBottom: 20 }}>{itemPreview}</div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#333350", marginBottom: 10, letterSpacing: "0.1em" }}>TAGS</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(selectedItem.tags || []).map(tag => (
                      <span key={tag} className="tag" style={{ background: itemColor + "15", color: itemColor, border: "1px solid " + itemColor + "30" }}>#{tag}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#333350", marginBottom: 10, letterSpacing: "0.1em" }}>RELATED SAVES</div>
                  {(selectedItem.related || []).map(rid => {
                    const rel = items.find(x => x.id === rid || x._id === rid);
                    if (!rel) return null;
                    const relTime = rel.time || new Date(rel.createdAt || Date.now()).toLocaleDateString();
                    const relIcon = rel.icon || typeIcon[rel.type] || "📄";
                    return (
                      <div key={rid} onClick={() => dispatch(setSelectedItem(rel))} style={{ display: "flex", gap: 10, padding: "10px", borderRadius: 10, background: "#0f0f1a", border: "1px solid #1e1e30", marginBottom: 8, cursor: "pointer", transition: "border-color 0.15s" }}>
                        <span style={{ fontSize: 16 }}>{relIcon}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#cccce0", lineHeight: 1.3 }}>{(rel.title || "").slice(0, 40)}…</div>
                          <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#333350", marginTop: 2 }}>{relTime}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          )})()}
        </div>
      </div>

      {/* Add URL Modal */}
      {addOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setAddOpen(false); }}>
          <div style={{ background: "#0f0f1a", border: "1px solid #1e1e30", borderRadius: 18, padding: 32, width: 460, animation: "fadeUp 0.25s ease" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#e8e8f0", marginBottom: 6 }}>Save to Mind</div>
            <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono'", color: "#555570", marginBottom: 24 }}>Paste any URL — article, tweet, video, PDF…</div>
            {saving ? (
              <div className="saving-shimmer" style={{ height: 48, borderRadius: 10, marginBottom: 16 }} />
            ) : saved ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "#6EE7B715", border: "1px solid #6EE7B730", borderRadius: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>✓</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#6EE7B7" }}>Saved & processing</div>
                  <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", color: "#555570" }}>AI tagging in progress…</div>
                </div>
              </div>
            ) : (
              <div>
                <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..." style={{ width: "100%", background: "#0a0a14", border: "1px solid #1e1e30", borderRadius: 10, padding: "13px 16px", color: "#e8e8f0", fontFamily: "'JetBrains Mono'", fontSize: 13, marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={categoryInput} onChange={e => setCategoryInput(e.target.value)} style={{ flex: 1, background: '#0a0a14', border: '1px solid #1e1e30', borderRadius: 8, padding: '10px 12px', color: '#e8e8f0' }}>
                    <option value="Links">Links</option>
                    <option value="Articles">Articles</option>
                    <option value="Videos">Videos</option>
                    <option value="Research">Research</option>
                    <option value="Other">Other</option>
                  </select>
                  <select value={"article"} disabled style={{ width: 120, background: '#0a0a14', border: '1px solid #1e1e30', borderRadius: 8, padding: '10px 12px', color: '#e8e8f0' }}>
                    <option value="article">article</option>
                  </select>
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setAddOpen(false); setSaved(false); }} style={{ flex: 1, padding: "12px", borderRadius: 10, background: "#12121e", border: "1px solid #1e1e30", color: "#555570", fontFamily: "'Syne'", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSave} className="glow-btn" style={{ flex: 2, padding: "12px", borderRadius: 10, background: "#6EE7B7", border: "none", color: "#080810", fontFamily: "'Syne'", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                {saving ? "Analyzing…" : saved ? "Saved ✓" : "Save & Analyze"}
              </button>
            </div>
            <div style={{ marginTop: 20, padding: "14px 16px", background: "#0a0a14", borderRadius: 10 }}>
              <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#333350", marginBottom: 8, letterSpacing: "0.1em" }}>AUTO-DETECTION</div>
              <div style={{ display: "flex", gap: 16 }}>
                {Object.entries(typeIcon).map(([type, icon]) => (
                  <span key={type} style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", color: "#555570" }}>{icon} {type}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}