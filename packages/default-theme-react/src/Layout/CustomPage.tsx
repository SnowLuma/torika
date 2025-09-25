import React from 'react';

export interface CustomPageProps {
    title?: string;
    content: string;
    meta?: Record<string, any>;
    className?: string;
    layout?: 'default' | 'full-width' | 'sidebar';
}

export function CustomPage({
    title,
    content,
    meta = {},
    className = '',
    layout = 'default'
}: CustomPageProps) {
    return (
        <div className={`custom-page custom-page--${layout} ${className}`.trim()}>
            {title && (
                <header className="custom-page-header">
                    <h1 className="custom-page-title">{title}</h1>
                    {meta.description && (
                        <p className="custom-page-description">{meta.description}</p>
                    )}
                </header>
            )}

            <main className="custom-page-main">
                <div
                    className="custom-page-content"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            </main>

            {meta.showDate && meta.date && (
                <footer className="custom-page-footer">
                    <time className="custom-page-date">
                        最后更新：{typeof meta.date === 'string' ? meta.date : meta.date.toISOString().split('T')[0]}
                    </time>
                </footer>
            )}
        </div>
    );
}

export default CustomPage;