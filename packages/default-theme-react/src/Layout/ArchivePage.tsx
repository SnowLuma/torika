import React from 'react';
import type { PostMeta } from './Post.js';

export interface ArchivePageProps {
  title?: string;
  posts?: Array<{
    meta: PostMeta;
    url: string;
  }>;
  groupBy?: 'year' | 'month' | 'none';
  className?: string;
}

export function ArchivePage({ 
  title = '归档', 
  posts = [], 
  groupBy = 'year',
  className = '' 
}: ArchivePageProps) {
  // 按日期分组文章
  const groupedPosts = React.useMemo(() => {
    if (groupBy === 'none') {
      return { '所有文章': posts };
    }

    const groups: Record<string, typeof posts> = {};
    
    posts.forEach(post => {
      if (!post.meta.date) return;
      
      const date = typeof post.meta.date === 'string' 
        ? new Date(post.meta.date) 
        : post.meta.date;
      
      let key: string;
      if (groupBy === 'year') {
        key = date.getFullYear().toString();
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key]!.push(post);
    });

    // 按时间倒序排序组
    const sortedGroups: Record<string, typeof posts> = {};
    Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .forEach(key => {
        sortedGroups[key] = groups[key]!.sort((a, b) => {
          const dateA = typeof a.meta.date === 'string' ? new Date(a.meta.date) : a.meta.date;
          const dateB = typeof b.meta.date === 'string' ? new Date(b.meta.date) : b.meta.date;
          return dateB!.getTime() - dateA!.getTime();
        });
      });

    return sortedGroups;
  }, [posts, groupBy]);

  return (
    <div className={`archive-page ${className}`.trim()}>
      <header className="archive-header">
        <h1 className="archive-title">{title}</h1>
        <p className="archive-count">共 {posts.length} 篇文章</p>
      </header>
      
      <main className="archive-main">
        {Object.keys(groupedPosts).length > 0 ? (
          <div className="archive-groups">
            {Object.entries(groupedPosts).map(([groupName, groupPosts]) => (
              <section key={groupName} className="archive-group">
                <h2 className="archive-group-title">{groupName}</h2>
                <ul className="archive-list">
                  {groupPosts.map((post, index) => (
                    <li key={index} className="archive-item">
                      <time className="archive-item-date">
                        {post.meta.date && (
                          typeof post.meta.date === 'string' 
                            ? post.meta.date.split('T')[0]
                            : post.meta.date.toISOString().split('T')[0]
                        )}
                      </time>
                      <a href={post.url} className="archive-item-title">
                        {post.meta.title || '无标题'}
                      </a>
                      {post.meta.tags && post.meta.tags.length > 0 && (
                        <div className="archive-item-tags">
                          {post.meta.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="tag">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
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

export default ArchivePage;