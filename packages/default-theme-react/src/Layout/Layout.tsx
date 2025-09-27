import React from 'react';
import Header from './Header.js';

export interface LayoutProps {
  title?: string | undefined;
  description?: string | undefined;
  children: React.ReactNode;
  className?: string;
}

export function Layout({ title, description, children, className = '' }: LayoutProps) {
  return (
    <div className={`layout ${className}`.trim()}>
      <Header />

      {title && (
        <div className="page-hero">
          <h1 className="page-hero-title">{title}</h1>
          {description && <p className="page-hero-desc">{description}</p>}
        </div>
      )}

      <main className="layout-main">
        <div className="content-inner">
          {children}
        </div>
      </main>

      <footer className="layout-footer">
        <p>© {new Date().getFullYear()} Torika</p>
      </footer>
    </div>
  );
}

export default Layout;