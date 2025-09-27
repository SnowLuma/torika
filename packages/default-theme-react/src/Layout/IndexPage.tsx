import React from 'react';
import type { PostMeta } from './Post.js';
import Header from './Header.js';

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
      <Header />
      <header className="index-header">
        <h1 className="page-hero-title">{title}</h1>
      </header>

      <main>
        <ul className="posts-list">
          {posts.map((post, index) => (
            <li key={index} className="post-item">
              <h2 className="post-item-title"><a href={post.url}>{post.meta.title || '无标题'}</a></h2>
              {post.meta.date && <time className="post-item-date">{typeof post.meta.date === 'string' ? post.meta.date : post.meta.date.toISOString().split('T')[0]}</time>}
              {post.excerpt && <p className="post-item-excerpt">{post.excerpt}</p>}
            </li>
          ))}
        </ul>
        {posts.length === 0 && <p className="no-posts">暂无文章</p>}
      </main>
    </div>
  );
}

export default IndexPage;