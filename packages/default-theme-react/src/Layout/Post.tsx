import React from 'react';

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
      {title && (
        <header className="post-header">
          <h1 className="post-title">{title}</h1>
        </header>
      )}
      <div 
        className="post-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  );
}

export default Post;