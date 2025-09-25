import React from 'react';
import type { PostMeta } from './Post.js';

export interface IndexPageProps {
  title?: string;
  posts?: Array<{
    meta: PostMeta;
    excerpt?: string;
    url: string;
  }>;
  className?: string;
}

export function IndexPage({ title = '首页', posts = [], className = '' }: IndexPageProps) {
  return (
    <div className={`index-page ${className}`.trim()}>
      <header className="index-header">
        <h1 className="index-title">{title}</h1>
      </header>
      
      <main className="index-main">
        {posts.length > 0 ? (
          <div className="posts-list">
            {posts.map((post, index) => (
              <article key={index} className="post-item">
                <header className="post-item-header">
                  <h2 className="post-item-title">
                    <a href={post.url}>{post.meta.title || '无标题'}</a>
                  </h2>
                  {post.meta.date && (
                    <time className="post-item-date">
                      {typeof post.meta.date === 'string' 
                        ? post.meta.date 
                        : post.meta.date.toISOString().split('T')[0]
                      }
                    </time>
                  )}
                </header>
                
                {post.excerpt && (
                  <div className="post-item-excerpt">
                    <p>{post.excerpt}</p>
                  </div>
                )}
                
                {post.meta.tags && post.meta.tags.length > 0 && (
                  <footer className="post-item-tags">
                    {post.meta.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="tag">#{tag}</span>
                    ))}
                  </footer>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="no-posts">
            <p>暂无文章</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default IndexPage;