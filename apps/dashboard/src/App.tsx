export default function App() {
  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">FggSnap</p>
        <h1>URL shortening, analytics, and fast delivery.</h1>
        <p>
          This project has been scaffolded as a working monorepo with an API and a dashboard,
          ready for feature development.
        </p>
        <div className="stats">
          <div>
            <strong>API</strong>
            <span>NestJS</span>
          </div>
          <div>
            <strong>UI</strong>
            <span>React + Vite</span>
          </div>
          <div>
            <strong>Stack</strong>
            <span>Monorepo</span>
          </div>
        </div>
      </section>
    </main>
  );
}
