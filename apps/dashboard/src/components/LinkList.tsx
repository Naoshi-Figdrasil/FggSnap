import { useState } from 'react';
import { ApiError, deleteLink } from '../services/api.js';
import { Link } from '../types/link.js';

type LinkListProps = {
  links: Link[];
  onChanged: () => void;
};

export function LinkList({ links, onChanged }: LinkListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleCopy(link: Link) {
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setActionError(null);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId((current) => (current === link.id ? null : current)), 1500);
    } catch {
      setActionError('Could not copy the short URL.');
    }
  }

  async function handleDelete(link: Link) {
    setDeletingId(link.id);
    try {
      await deleteLink(link.id);
      setActionError(null);
      onChanged();
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : 'Could not delete the link.');
    } finally {
      setDeletingId(null);
    }
  }

  if (links.length === 0) {
    return <p className="empty-state">No links yet. Create your first one above.</p>;
  }

  return (
    <>
      {actionError && <p role="alert" className="form-error">{actionError}</p>}
      <div className="table-wrap">
      <table className="link-list">
      <thead>
        <tr>
          <th>Alias</th>
          <th>Original URL</th>
          <th>Clicks</th>
          <th>Created</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {links.map((link) => (
          <tr key={link.id}>
            <td>{link.alias}</td>
            <td className="original-url" title={link.originalUrl}>
              {link.originalUrl}
            </td>
            <td>{link.clicks}</td>
            <td>{new Date(link.createdAt).toLocaleString()}</td>
            <td className="actions">
              <button type="button" onClick={() => handleCopy(link)}>
                {copiedId === link.id ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => handleDelete(link)}
                disabled={deletingId === link.id}
              >
                {deletingId === link.id ? 'Deleting…' : 'Delete'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
      </table>
      </div>
    </>
  );
}