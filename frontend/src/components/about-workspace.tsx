export function AboutWorkspace() {
  return (
    <main className="page-shell">
      <section className="page-header-compact">
        <div>
          <h1>About</h1>
          <p>Product stack and roadmap</p>
        </div>
      </section>

      <section className="grid stats-grid">
        <article className="panel stat-card">
          <div className="stat-label">Currency model</div>
          <div className="stat-value">INR</div>
          <div className="stat-footnote">Rupee-first defaults across tracking and reporting</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Core stack</div>
          <div className="stat-value">Next + FastAPI</div>
          <div className="stat-footnote">A practical split between product UI and business logic</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Data layer</div>
          <div className="stat-value">Postgres</div>
          <div className="stat-footnote">SQLite locally, PostgreSQL for containerized deployment</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Automation path</div>
          <div className="stat-value">Alerts + AI</div>
          <div className="stat-footnote">Receipts, OCR, and intelligent insights</div>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <h2 className="section-title">Product layers</h2>
          <div className="checklist">
            <div className="checklist-item">
              <span className="check">1</span>
              <div>
                <div className="item-title">Capture layer</div>
                <div className="item-subtitle">
                  Transactions, categories, payment context, and clean day-to-day bookkeeping.
                </div>
              </div>
            </div>
            <div className="checklist-item">
              <span className="check">2</span>
              <div>
                <div className="item-title">Control layer</div>
                <div className="item-subtitle">
                  Report summaries, category trends, and policy-driven spending visibility.
                </div>
              </div>
            </div>
            <div className="checklist-item">
              <span className="check">3</span>
              <div>
                <div className="item-title">Automation layer</div>
                <div className="item-subtitle">
                  Receipt workflows, recurring spend detection, and spending alert rules.
                </div>
              </div>
            </div>
            <div className="checklist-item">
              <span className="check">4</span>
              <div>
                <div className="item-title">Intelligence layer</div>
                <div className="item-subtitle">
                  Receipt OCR, category suggestions, anomaly detection, and natural-language insights.
                </div>
              </div>
            </div>
            <div className="checklist-item">
              <span className="check">5</span>
              <div>
                <div className="item-title">Platform layer</div>
                <div className="item-subtitle">
                  Containers, CI, managed databases, secure config, and a repeatable deployment path.
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
            <span className="badge">Redis-ready</span>
            <span className="badge">Docker</span>
            <span className="badge">GitHub Actions</span>
          </div>
        </aside>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <h2 className="section-title">Deployment readiness</h2>
          <p className="section-copy">
            The repository is being shaped so the same project can run locally, inside Docker, and
            on a hosted environment with only environment-variable changes.
          </p>
          <div className="checklist">
            <div className="checklist-item">
              <span className="check">1</span>
              <div>
                <div className="item-title">Frontend container</div>
                <div className="item-subtitle">
                  Production-ready Next.js build using a standalone output.
                </div>
              </div>
            </div>
            <div className="checklist-item">
              <span className="check">2</span>
              <div>
                <div className="item-title">Backend container</div>
                <div className="item-subtitle">
                  FastAPI app booting from environment-driven database and origin settings.
                </div>
              </div>
            </div>
            <div className="checklist-item">
              <span className="check">3</span>
              <div>
                <div className="item-title">Production handoff</div>
                <div className="item-subtitle">
                  Final go-live still needs real hosting credentials, domains, and secrets.
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
