import React from 'react';

export interface MinimalLayoutProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function MinimalLayout({ title, children, className = '' }: MinimalLayoutProps) {
  return (
    <div className={`minimal-layout ${className}`.trim()}>
      <header className="minimal-header">
        {title && <h1 className="minimal-site-title">{title}</h1>}
        <nav className="minimal-nav">
          <a href="/">首页</a>
          <a href="/about.html">关于</a>
        </nav>
      </header>
      <main className="minimal-main">
        {children}
      </main>
      <footer className="minimal-footer">
        <p>© 2024 - Powered by Torika Custom Theme</p>
      </footer>
    </div>
  );
}

export default MinimalLayout;