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
          <div className="post-meta">
            {author && <span className="post-author">作者: {author}</span>}
            {date && (
              <span className="post-date">
                日期: {date instanceof Date ? date.toLocaleDateString('zh-CN') : date}
              </span>
            )}
            {tags && tags.length > 0 && (
              <div className="post-tags">
                标签: {tags.map((tag, index) => (
                  <span key={index} className="post-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
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