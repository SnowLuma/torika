import React from 'react';

export interface MinimalPostProps {
  meta: {
    title?: string;
    author?: string;
    date?: string | Date;
    tags?: string[];
    [key: string]: any;
  };
  content: string;
  className?: string;
}

export function MinimalPost({ meta, content, className = '' }: MinimalPostProps) {
  const { title, author, date, tags } = meta;

  return (
    <article className={`minimal-post ${className}`.trim()}>
      <header className="minimal-post-header">
        {title && <h1 className="minimal-post-title">{title}</h1>}
        <div className="minimal-post-meta">
          {author && <span className="minimal-post-author">作者: {author}</span>}
          {date && (
            <time className="minimal-post-date">
              {typeof date === 'string' ? date : date.toISOString().split('T')[0]}
            </time>
          )}
        </div>
        {tags && tags.length > 0 && (
          <div className="minimal-post-tags">
            {tags.map((tag, index) => (
              <span key={index} className="minimal-tag">#{tag}</span>
            ))}
          </div>
        )}
      </header>
      
      <div 
        className="minimal-post-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  );
}

export default MinimalPost;