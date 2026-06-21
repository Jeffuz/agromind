import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <section>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
