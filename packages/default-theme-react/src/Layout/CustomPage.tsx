import React from 'react';
import Header from './Header.js';

export interface CustomPageProps {
    title?: string;
    content?: string;
    className?: string;
}

export function CustomPage({ title, content = '', className = '' }: CustomPageProps) {
    return (
        <div className={`custom-page ${className}`.trim()}>
            <Header />
            {title && <h1 className="page-hero-title">{title}</h1>}
            <div className="post-content" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
    );
}

export default CustomPage;