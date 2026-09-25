# Project Rules & Customizations — AI Study Planner

## 1. Visual Design & Theme Mandate
- **STRICT LIGHT COLOR THEME ONLY:** The website must NEVER be styled in a dark color theme or dark mode.
- All page backgrounds must be `bg-slate-50` or `bg-white`.
- Surfaces, containers, modals, and cards must be `bg-white` with `border-slate-200`.
- Sidebar must be light (`bg-white` with `border-r border-slate-200`).
- Text must be high-contrast dark neutrals (`text-slate-900`, `text-slate-800`, `text-slate-700`, `text-slate-500`).
- Interactive elements must use vibrant accessible accents (`indigo-600`, `emerald-600`, `violet-600`).
- See `.agents/rules/ui-theme.md` for complete design token guidance.

## 2. Phase-by-Phase Discipline
- Follow the architectural blueprint in `docs/PHASE_0_ARCHITECTURE_BLUEPRINT.md`.
- Never jump ahead to future phases prematurely.
- Preserve existing working code and verified tests.
