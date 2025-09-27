import React from 'react';
import Header from './Header.js';

export interface AboutPageProps {
  meta: {
    title?: string;
    showTeam?: boolean;
    foundedYear?: number;
    [key: string]: any;
  };
  content: string;
  className?: string;
}

export function AboutPage({ meta, content, className = '' }: AboutPageProps) {
  const { title = '关于我们', showTeam = false, foundedYear } = meta;
  return (
    <div className={`about-page ${className}`.trim()}>
      <Header />
      <header>
        <h1 className="page-hero-title">{title}</h1>
        {foundedYear && <p className="post-item-date">成立于 {foundedYear} 年</p>}
      </header>

      <main>
        <div className="post-content" dangerouslySetInnerHTML={{ __html: content }} />

        {showTeam && (
          <section className="team-grid">
            {/* 示例占位：保留简单卡片布局 */}
            <div className="team-member">
              <h3>张三</h3>
              <p>创始人</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default AboutPage;