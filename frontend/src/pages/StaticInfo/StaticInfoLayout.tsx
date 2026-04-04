import type { ReactNode } from 'react';
import styles from './StaticInfoLayout.module.css';

export interface StaticInfoSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

interface StaticInfoLayoutProps {
  title: string;
  subtitle: string;
  sections: StaticInfoSection[];
  updatedAt?: string;
  children?: ReactNode;
}

export function StaticInfoLayout({
  title,
  subtitle,
  sections,
  updatedAt,
  children,
}: StaticInfoLayoutProps) {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.hero}>
          {updatedAt ? <p className={styles.updatedAt}>Actualizado: {updatedAt}</p> : null}
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
          {children ? <div className={styles.extra}>{children}</div> : null}
        </header>

        {sections.map((section) => (
          <section key={section.title} className={styles.card}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            {section.paragraphs?.map((paragraph, index) => (
              <p key={`${section.title}-p-${index}`} className={styles.paragraph}>
                {paragraph}
              </p>
            ))}
            {section.bullets?.length ? (
              <ul className={styles.bulletList}>
                {section.bullets.map((bullet, index) => (
                  <li key={`${section.title}-b-${index}`} className={styles.bulletItem}>
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </main>
  );
}
