---
version: alpha
colors:
  primary: "#176b59"
  ink: "#182b26"
  muted: "#5f7068"
  background: "#f7f9f8"
  surface: "#ffffff"
  accent: "#f4c85b"
  border: "#dee6e1"
  scrollbarThumb: "#91aaa0"
  scrollbarHover: "#53665f"
typography:
  display:
    fontFamily: "Manrope, Nirmala UI, sans-serif"
  body:
    fontFamily: "Manrope, Nirmala UI, sans-serif"
rounded:
  card: "16px"
  control: "10px"
spacing:
  unit: "8px"
components:
  NeedCard:
    height: "84px"
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
Product register: a neighbourhood wayfinding desk for people on the move in Kolkata. One job: make the next suitable place easy to choose. Signature: a bold two-line wayfinding headline, three compact need rows and a real Kolkata map. The owner requested a modern minimalist redesign on 11 October 2026. Avoid dashboard tiles, environmental impact counters and ornamental skyline graphics.

## Colors
Leaf green conveys wayfinding. Yellow highlights electronics without turning uncertainty into a success colour. White list and map surfaces sit against a pale green page. Runtime CSS variables in frontend/src/styles.css are the canonical token owner; frontmatter mirrors the accepted values. Shared controls consume those variables; all shared controls consume those variables. Type-specific marker colours are defined once in the map component and matching stylesheet classes.

## Typography
Self-hosted variable Manrope carries English display and body text with deliberate weight and tracking. Nirmala UI carries Bengali and Devanagari when unavailable in Manrope. Font-display swap and a local font avoid third-party font calls; the SIL Open Font License is shipped with the asset. Localized body text uses generous line height and wraps rather than truncates.

## Layout
Three hash-routed views: Start, Nearby and How it works. Desktop Start uses an asymmetric introduction/map split; Nearby uses a full viewport Kolkata map with floating search/type/location controls, an optional search-guidance panel and a compact modeless place panel. Mobile Start prioritizes compact need choices; Nearby has List/Map controls, a document-scrolling card list and a clear map canvas, and a persistent three-link bottom navigation connects views. Start and How it works use natural document scrolling. Nearby Map owns a fixed viewport with preserved attribution. Nearby List uses natural page scrolling without a containing panel. Place details have a scrollable body and a pinned action footer. Maximum content width 1280px; breakpoint 760px; 8px spacing rhythm.

## Elevation & Depth
Flat cards with borders. Light shadows separate floating map controls, place panels and modal overlays from the map.

## Shapes
16px panels, 10px controls; compact type markers and clear text labels. Need choices are rows instead of equal cards. Icons are simple code-native line drawings, always accompanied by text.

## Components
Shared Button, Field, Dialog, PlacePanel and Status primitives. Visible focus rings, 44px touch targets, reserved error regions, app-owned native dialog with focus restoration. Global visible scrollbar baseline. No animations needed beyond short colour transitions; respect reduced motion.

## Do's and Don'ts
Show source, distance origin and uncertainty. Use “Community confirmed” for vote-derived status. Do not infer opening hours, cleanliness or authorisation from a marker. Keep contributed text in its original language. Every main action has all three translations.

## Nearby map direction
The owner approved the Bangalore Startup Map reference on 11 October 2026. Borrow its full map canvas and floating control hierarchy; retain Kahaan branding and existing OpenStreetMap tiles. Map shows no persistent nearby-results panel; List owns nearest-first cards on desktop and mobile. Details sit right on desktop. At intermediate widths, selected details replace results. Mobile List switches to a full-page single-column card surface, matching the reference Grid behavior. Map restores the clear map canvas. Selecting a card returns to Map with details above persistent navigation. Markers use letters, type colours and localized accessible names; Enter/Space selects. Search and category changes close stale details. Existing source warnings and item guidance remain in the scrollable results panel. No new dependencies or AWS resources.
