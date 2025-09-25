import React from 'react';

export interface LayoutProps {
  title?: string | undefined;
  children: React.ReactNode;
  className?: string;
}

export function Layout({ title, children, className = '' }: LayoutProps) {
  return (
    <div className={`layout ${className}`.trim()}>
      {title && (
        <header className="layout-header">
          <h1>{title}</h1>
        </header>
      )}
      <main className="layout-main">
        {children}
      </main>
      <footer className="layout-footer">
        <p>Powered by Torika & React</p>
      </footer>
    </div>
  );
}

export default Layout;