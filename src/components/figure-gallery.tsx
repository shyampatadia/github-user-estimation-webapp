"use client";

import Image from "next/image";
import { FIGURE_CAPTIONS } from "@/lib/constants";
import { useState } from "react";

interface FigureCardProps {
  src: string;
  figKey: string;
}

function FigureCard({ src, figKey }: FigureCardProps) {
  const [expanded, setExpanded] = useState(false);
  const caption = FIGURE_CAPTIONS[figKey];
  if (!caption) return null;

  return (
    <>
      <button
        onClick={() => setExpanded(true)}
        className="group rounded-lg border border-border bg-card overflow-hidden hover:border-primary/30 transition-all text-left"
      >
        <div className="relative aspect-[4/3] bg-[hsl(220,13%,5%)] flex items-center justify-center p-4">
          <Image
            src={src}
            alt={caption.title}
            fill
            className="object-contain p-3 group-hover:scale-[1.02] transition-transform"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="p-4 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-1">{caption.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{caption.description}</p>
        </div>
      </button>

      {/* Lightbox */}
      {expanded && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setExpanded(false)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm flex items-center gap-1"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
            <div className="relative w-full" style={{ aspectRatio: "16/10" }}>
              <Image
                src={src}
                alt={caption.title}
                fill
                className="object-contain rounded-lg"
                sizes="100vw"
                quality={95}
              />
            </div>
            <div className="mt-3 text-center">
              <h3 className="text-sm font-semibold text-white">{caption.title}</h3>
              <p className="text-xs text-white/60 mt-1">{caption.description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const FIGURES = [
  { key: "fig1_unbiasedness", src: "/figures/fig1_unbiasedness.png" },
  { key: "fig2_correctness", src: "/figures/fig2_correctness.png" },
  { key: "fig3_relative_error", src: "/figures/fig3_relative_error.png" },
  { key: "fig4_density_stratum", src: "/figures/fig4_density_stratum.png" },
  { key: "fig5_bootstrap_dist", src: "/figures/fig5_bootstrap_dist.png" },
  { key: "fig6_multi_metric", src: "/figures/fig6_multi_metric.png" },
  { key: "fig7_stratum_heatmap", src: "/figures/fig7_stratum_heatmap.png" },
  { key: "fig9_convergence", src: "/figures/fig9_convergence.png" },
  { key: "fig10_validation_scatter", src: "/figures/fig10_validation_scatter.png" },
];

export function FigureGallery() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {FIGURES.map((fig) => (
        <FigureCard key={fig.key} src={fig.src} figKey={fig.key} />
      ))}
    </div>
  );
}

export function SingleFigure({ figKey, src }: { figKey: string; src: string }) {
  return <FigureCard src={src} figKey={figKey} />;
}
