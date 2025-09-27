import React from 'react';

export interface HeaderProps {
  className?: string;
}

export function Header({ className = '' }: HeaderProps) {
  return (
    <header className={`site-header ${className}`.trim()}>
      <div className="site-brand">
        <a href="/" className="site-name">Torika</a>
      </div>
      <nav className="header-nav" aria-label="主导航">
        <a className="nav-link" href="/">首页</a>
        <a className="nav-link" href="/about/index.html">关于</a>
        <a className="nav-link" href="/archive.html">归档</a>
        <a className="nav-link" href="/test.html">示例</a>
      </nav>
    </header>
  );
}

export default Header;
