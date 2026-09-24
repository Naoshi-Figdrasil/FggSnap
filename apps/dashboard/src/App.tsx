import { useCallback, useEffect, useState } from 'react';
import { CreateLinkForm } from './components/CreateLinkForm.js';
import { LinkList } from './components/LinkList.js';
import { listLinks } from './services/api.js';
import { Link } from './types/link.js';

export default function App() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLinks(await listLinks());
      setLoadError(null);
    } catch {
      setLoadError('Could not load links from the API.');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">FggSnap</p>
        <h1>URL shortener</h1>

        <CreateLinkForm onCreated={refresh} />

        {loadError && <p role="alert" className="form-error">{loadError}</p>}
        <LinkList links={links} onChanged={refresh} />
      </section>
    </main>
  );
}