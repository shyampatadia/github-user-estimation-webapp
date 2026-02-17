"use client";

import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathBlockProps {
  math: string;
  display?: boolean;
  className?: string;
}

export function MathBlock({ math, display = true, className = "" }: MathBlockProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      katex.render(math, ref.current, {
        displayMode: display,
        throwOnError: false,
        trust: true,
      });
    }
  }, [math, display]);

  return (
    <span
      ref={ref}
      className={`${display ? "block my-4 overflow-x-auto" : "inline"} ${className}`}
    />
  );
}
