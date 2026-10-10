---
version: alpha
colors:
  primary: "#176b59"
  ink: "#172e29"
  muted: "#53665f"
  background: "#f2f6f3"
  surface: "#ffffff"
  accent: "#f4c85b"
  border: "#d6e1db"
  scrollbarThumb: "#91aaa0"
  scrollbarHover: "#53665f"
typography:
  display:
    fontFamily: "Georgia, Nirmala UI, serif"
  body:
    fontFamily: "Segoe UI, Nirmala UI, sans-serif"
rounded:
  card: "20px"
  control: "12px"
spacing:
  unit: "8px"
components:
  NeedCard:
    height: "120px"
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  Button:
    height: "44px"
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
---

# Kahaan design context

## Overview
Product register: a neighbourhood wayfinding desk for people on the move in Kolkata. One job: make the next suitable place easy to choose. Signature: three illustrated signpost cards for toilets, bins and electronics, paired with a real civic map. Avoid dashboard tiles, environmental impact counters and ornamental skyline graphics.

## Colors
Leaf green conveys wayfinding. Yellow highlights electronics without turning uncertainty into a success colour. White list and map surfaces sit against a pale green page. CSS custom properties in frontend/src/styles.css implement the frontmatter; all shared controls consume those variables. Type-specific marker colours are defined once in the map component and matching stylesheet classes.

## Typography
Georgia adds a restrained human display headline; Segoe UI and Nirmala UI carry functional English, Bengali and Devanagari. Native system fonts avoid layout shifts. Localized body text uses generous line height and wraps rather than truncates.

## Layout
Desktop: compact header, three choices, then a list/map split. Mobile: stacked choices and results with an explicit List/Map toggle. Natural document scrolling; no locked viewport. Maximum content width 1320px; breakpoint 760px; 8px spacing rhythm.

## Elevation & Depth
Flat cards with borders. A light shadow belongs only to selected place panels and modal overlays.

## Shapes
20px cards, 12px controls; rounded type markers and clear text labels. Icons are simple code-native line drawings, always accompanied by text.

## Components
Shared Button, Field, Dialog and Status primitives. Visible focus rings, 44px touch targets, reserved error regions, app-owned native dialog with focus restoration. Global visible scrollbar baseline. No animations needed beyond short colour transitions; respect reduced motion.

## Do's and Don'ts
Show source, distance origin and uncertainty. Use “Community confirmed” for vote-derived status. Do not infer opening hours, cleanliness or authorisation from a marker. Keep contributed text in its original language. Every main action has all three translations.
