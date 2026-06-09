export function AboutWorkspace() {
  return (
    <main className="page-shell">
      <section className="hero">
        <article className="hero-card">
          <span className="eyebrow">About Us</span>
          <h1>Built to make spending feel understandable, not intimidating.</h1>
          <p>
            Smart Expense Tracker is being shaped as a calm finance tool: record clearly, organize
            consistently, and grow into smarter insights only when the foundations are trustworthy.
          </p>
        </article>

        <aside className="hero-side">
          <div className="hero-card side-card">
            <h2>Product direction</h2>
            <p>
              Start with excellent manual tracking, then layer reporting, alerts, OCR, and AI on
              top of stable financial records.
            </p>
          </div>
        </aside>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <h2 className="section-title">What this app stands for</h2>
          <div className="checklist">
            <div className="checklist-item">
              <span className="check">1</span>
              <div>
                <div className="item-title">Clarity first</div>
                <div className="item-subtitle">
                  Good records and readable reports matter more than flashy automation.
                </div>
              </div>
            </div>
            <div className="checklist-item">
              <span className="check">2</span>
              <div>
                <div className="item-title">Useful structure</div>
                <div className="item-subtitle">
                  Categories, reports, and alerts should help decision-making, not create clutter.
                </div>
              </div>
            </div>
            <div className="checklist-item">
              <span className="check">3</span>
              <div>
                <div className="item-title">Smart features with restraint</div>
                <div className="item-subtitle">
                  AI belongs on top of reliable data, not in place of it.
                </div>
              </div>
            </div>
          </div>
        </article>

        <aside className="panel">
          <h2 className="section-title">Current stack</h2>
          <div className="badge-row">
            <span className="badge">Next.js</span>
            <span className="badge">React</span>
            <span className="badge">TypeScript</span>
            <span className="badge">FastAPI</span>
            <span className="badge">SQLAlchemy</span>
            <span className="badge">SQLite / PostgreSQL</span>
          </div>
        </aside>
      </section>
    </main>
  );
}
