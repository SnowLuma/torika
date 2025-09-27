import React from 'react';
import Header from './Header.js';

export interface ArchivePageProps {
  title?: string;
  groups?: Array<{
    title?: string;
    items?: Array<{ title?: string; url?: string; date?: string | Date }>;
  }>;
  className?: string;
}

export function ArchivePage({ title = '归档', groups = [], className = '' }: ArchivePageProps) {
  return (
    <div className={`archive-page ${className}`.trim()}>
      <Header />
      <header>
        <h1 className="page-hero-title">{title}</h1>
      </header>

      <main>
        {groups.map((g, gi) => (
          <section key={gi} className="archive-group">
            {g.title && <h2 className="archive-group-title">{g.title}</h2>}
            <ul className="archive-list">
              {(g.items || []).map((it, i) => (
                <li key={i} className="archive-item">
                  <a href={it.url} className="archive-item-title">{it.title}</a>
                  {it.date && <time className="archive-item-date">{typeof it.date === 'string' ? it.date : it.date.toISOString().split('T')[0]}</time>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}

export default ArchivePage;