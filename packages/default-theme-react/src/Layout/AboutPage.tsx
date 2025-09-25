import React from 'react';

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
      <header className="about-header">
        <h1 className="about-title">{title}</h1>
        {foundedYear && (
          <p className="about-founded">成立于 {foundedYear} 年</p>
        )}
      </header>
      
      <main className="about-main">
        <div 
          className="about-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />
        
        {showTeam && (
          <section className="about-team">
            <h2>团队成员</h2>
            <div className="team-grid">
              <div className="team-member">
                <h3>张三</h3>
                <p>创始人 & CEO</p>
                <p>负责产品战略和团队管理</p>
              </div>
              <div className="team-member">
                <h3>李四</h3>
                <p>技术总监</p>
                <p>负责技术架构和开发</p>
              </div>
              <div className="team-member">
                <h3>王五</h3>
                <p>设计师</p>
                <p>负责UI/UX设计</p>
              </div>
            </div>
          </section>
        )}
      </main>
      
      <footer className="about-footer">
        <p>感谢您对Torika的关注和支持！</p>
      </footer>
    </div>
  );
}

export default AboutPage;