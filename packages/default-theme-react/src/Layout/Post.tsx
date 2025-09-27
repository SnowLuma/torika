import React from 'react';
import Header from './Header.js';

export interface PostMeta {
  title?: string;
  author?: string;
  date?: string | Date;
  tags?: string[];
  [key: string]: any;
}

export interface PostProps {
  meta: PostMeta;
  content: string;
  className?: string;
}

export function Post({ meta, content, className = '' }: PostProps) {
  const { title, author, date, tags } = meta;

  return (
    <article className={`post ${className}`.trim()}>
      <Header />
      {title && (
        <header>
          <h1 className="post-title">{title}</h1>
          {date && <time className="post-item-date">{typeof date === 'string' ? date : date.toISOString().split('T')[0]}</time>}
        </header>
      )}

      <div className="post-content" dangerouslySetInnerHTML={{ __html: content }} />

      {tags && tags.length > 0 && (
        <footer className="post-item-tags">
          {tags.map((t, i) => <span key={i} className="tag">{t}</span>)}
        </footer>
      )}
    </article>
  );
}

export default Post;