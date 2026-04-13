# ADR-002: React 19 as Frontend Framework

## Status

Accepted

## Date

2026-04-13

## Context

We evaluated several frontend frameworks for the Tauri UI layer: **React 19**, **Svelte 5**, **Vue 3**, and **Solid.js**.

## Decision

We chose **React 19** with TypeScript.

## Rationale

1. **Team familiarity**: The core team has extensive experience with React, reducing onboarding time and development risk.
2. **Ecosystem maturity**: React has the largest ecosystem of UI libraries, tools, and community resources. This accelerates development of complex features (modals, drag-and-drop, animations).
3. **Hiring and contributions**: React is the most widely-known frontend framework, making it easier for open-source contributors to get involved.
4. **Zustand integration**: Zustand provides lightweight, type-safe state management that pairs well with React's model.
5. **Framer Motion**: The best animation library in the ecosystem, exclusive to React.

## Alternatives Considered

### Svelte 5
- **Pros**: Smaller bundle (~4x), built-in reactivity, less boilerplate
- **Cons**: Smaller ecosystem, fewer contributors familiar with it, less mature tooling for complex desktop UIs

### Vue 3
- **Pros**: Good middle ground, Composition API is clean
- **Cons**: Smaller ecosystem than React, less animation tooling

## Trade-offs

- Slightly larger bundle size compared to Svelte
- Requires Zustand for state management (vs. built-in reactivity)
- React's Virtual DOM adds runtime overhead (acceptable for a desktop app)

## Consequences

- All UI components are React functional components with TypeScript
- State management via Zustand stores
- Animations via Framer Motion
- Styling via Tailwind CSS v4 with utility classes
