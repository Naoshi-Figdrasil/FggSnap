import { FormEvent, useState } from 'react';
import { createLink } from '../services/api.js';
import { ApiError } from '../services/api.js';

type CreateLinkFormProps = {
  onCreated: () => void;
};

export function CreateLinkForm({ onCreated }: CreateLinkFormProps) {
  const [url, setUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createLink({
        url,
        customAlias: customAlias.trim() || undefined,
        // datetime-local gives "2026-12-31T23:59"; the API expects a full ISO string.
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
      setUrl('');
      setCustomAlias('');
      setExpiresAt('');
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="create-link-form" onSubmit={handleSubmit}>
      <h2>Create a short link</h2>

      <label htmlFor="url">URL</label>
      <input
        id="url"
        type="url"
        placeholder="https://example.com/very/long/url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        required
      />

      <label htmlFor="customAlias">Custom alias (optional)</label>
      <input
        id="customAlias"
        type="text"
        placeholder="my-alias"
        value={customAlias}
        onChange={(event) => setCustomAlias(event.target.value)}
      />

      <label htmlFor="expiresAt">Expires at (optional)</label>
      <input
        id="expiresAt"
        type="datetime-local"
        value={expiresAt}
        onChange={(event) => setExpiresAt(event.target.value)}
      />

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating…' : 'Create link'}
      </button>
    </form>
  );
}