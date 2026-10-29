# ADR-0001: Selection of Chart.js Canvas Engine over D3.js SVG for Offline Field Analytics

**Date**: 2026-10-28  
**Status**: accepted  
**Deciders**: Agri Experience Engineering & Survey Analytics Team  

## Context

AE Survey requires rich, interactive statistical visualizations for its **Analyze Results** stage, supporting diverse survey question types (Categorical frequencies, Net Promoter Score donuts, Star rating distributions, numerical harvest yield histograms, and Likert scale matrices).

The application operates as an offline-first Progressive Web App (PWA) frequently deployed on low-to-mid range Android tablets and ruggedized phones used by enumerators in rural agricultural settings across Kenya.

We evaluated two leading visualization technologies:
1. **D3.js (Data-Driven Documents)**
2. **Chart.js**

## Decision

We chose **Chart.js (v4.4.1 UMD minified)** packaged locally into `js/chart.umd.min.js` and cached by the Service Worker (`sw.js`). We pair every chart with a comprehensive frequency and statistical response tabulation data table.

## Alternatives Considered

### Alternative 1: D3.js (Data-Driven Documents)
- **Pros**: Complete geometric flexibility, expressive SVG path manipulations, unmatched custom layouts.
- **Cons**: High DOM node overhead (thousands of SVG elements created across 15+ survey questions), significant memory and CPU pressure on low-power mobile devices, and complex manual boilerplate required for reactive chart re-rendering.
- **Why not**: SVG DOM overhead causes noticeable jank and stutter when scrolling through lengthy multi-question survey analyses on mobile tablets.

### Alternative 2: Chart.js
- **Pros**: 
  - Declarative HTML5 `<canvas>` rendering: Hardware-accelerated with minimal memory footprint and zero DOM element bloat.
  - Offline distribution: Single self-contained minified bundle (`~196KB`) with zero external runtime dependencies.
  - Interactive adaptability: Seamless client-side chart type switching (`Horizontal Bar`, `Vertical Bar`, `Doughnut`) on the fly.
  - Built-in touch and hover tooltips: High-resolution retina scaling with accessible contrast.
- **Cons**: Canvas pixels are not directly inspectable in the DOM.
- **Mitigation**: Paired with native HTML response tabulation data tables offering full text selection, copy-paste, screen reader accessibility, and per-question CSV export.

## Consequences

### Positive
- Sub-50ms render times across complex survey response datasets.
- 100% offline functionality with zero external CDN reliance.
- Consistent brand aesthetic aligned with AE Survey design system.
- Users can switch view modes dynamically (`Both`, `Chart Only`, `Table Only`).

### Negative
- Custom non-standard visual forms (e.g., non-Cartesian tree topologies) require custom canvas plugins rather than standard SVG templates.

