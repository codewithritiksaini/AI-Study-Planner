# UI Theme Rules — AI Study Planner

## ⚠️ MANDATORY RULE: STRICT LIGHT THEME ONLY

The entire AI Study Planner web application **MUST BE DESIGNED IN A LIGHT THEME ONLY**.
Dark mode / dark theme is strictly prohibited across all screens, layouts, and components.

### 1. Color Palette Standards
* **Page Backgrounds:** `bg-slate-50` (or `bg-white`, or subtle soft tints like `bg-gradient-to-b from-indigo-50/40 via-white to-slate-50`).
* **Card & Surface Backgrounds:** `bg-white` with clean, subtle borders `border-slate-200` or `border-slate-200/80` and subtle elevation (`shadow-xs`, `shadow-sm`).
* **Sidebar:** Clean light sidebar `bg-white` with right border `border-slate-200`. Active items use `bg-indigo-50 text-indigo-700 font-semibold border-r-2 border-indigo-600`. Inactive items use `text-slate-600 hover:bg-slate-100 hover:text-slate-900`.
* **Header:** `bg-white/95 backdrop-blur-xs border-b border-slate-200/80`.
* **Primary Text:** `text-slate-900` or `text-slate-800`.
* **Muted / Subtitle Text:** `text-slate-500` or `text-slate-600`.
* **Form Inputs:** `bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500`.
* **Brand Accents:** Indigo (`indigo-600`), Violet (`violet-600`), Emerald (`emerald-600`), Amber (`amber-500`), Rose (`rose-600`).

### 2. Prohibited Classes
* ❌ `bg-slate-900`, `bg-slate-950`, `bg-slate-800` as screen or card backgrounds.
* ❌ `text-white` on broad containers (only use `text-white` on filled accent buttons like `bg-indigo-600` or badges).
* ❌ `dark:` Tailwind variants (do not introduce dark mode toggle or styles).
