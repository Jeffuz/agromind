interface PageHeaderProps {
  title?: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header>
      <p>AgroMind</p>
      {title && <h1>{title}</h1>}
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
}
