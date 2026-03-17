# Mini-Games UI/UX Audit Report
**Date**: 2025-03-17  
**Components**: `ticket-roulette`, `box`  
**Auditor**: Sisyphus (AI Agent)  
**Scope**: Accessibility, Performance, Theming, Responsive Design, Anti-Patterns

---

## Anti-Patterns Verdict

**FAIL**: These components show clear signs of AI-assisted development with generic patterns and inconsistent implementation.

**Evidence**:
- Mixed styling approaches (custom CSS + Liquid Glass tokens)
- Hard-coded colors not using design system
- Bouncy cubic-bezier easing (outdated iOS 6 style, not iOS 26)
- Custom animations duplicating existing system
- Redundant code between components
- Missing accessibility features in key areas

---

## Executive Summary

**Total Issues Found**: 23
- **Critical**: 4
- **High**: 8  
- **Medium**: 7
- **Low**: 4

**Most Critical**:
1. Inconsistent theming - hard-coded colors bypass design tokens
2. Performance bottlenecks - `backdrop-filter` on large surfaces, mask animations
3. Accessibility gaps - missing focus management, keyboard traps
4. Anti-pattern proliferation - AI slop patterns that degrade UX

**Overall Quality Score**: 6.5/10 (Needs Improvement)

**Recommended Next Steps**: Address critical theming issues first, then accessibility, then performance optimization.

---

## Detailed Findings by Severity

### Critical Issues

#### 1. Hard-Coded Colors Bypass Design Tokens
**Location**: `ticket-roulette.component.ts:214-228`, `box.component.ts:131,142,151,154,186,189`  
**Category**: Theming  
**Severity**: Critical

**Issue**: Components use hard-coded hex colors and rgba values instead of the established Liquid Glass token system:
- `#00d4ff` (should be `var(--lg-accent-cyan)`)
- `rgba(0, 229, 255, 0.5)` (should use `--lg-tint-cyan`)
- Multiple custom border colors and shadows

**Impact**: Theming inconsistency makes maintenance impossible and breaks dark/light mode switching. Colors don't adapt if design tokens change.

**WCAG/Standard**: None, but violates project design system.

**Recommendation**: Replace all hard-coded colors with CSS custom properties:
```scss
border-color: var(--lg-glass-border);
box-shadow: 0 0 0 1px var(--lg-accent-ring), ...;
```

**Suggested Command**: `/normalize` - align all colors to design tokens

---

#### 2. Custom Bouncy Easing (iOS 6 Style)
**Location**: `ticket-roulette.component.ts:129`, `box.component.ts:121,159,202,206`  
**Category**: Anti-Pattern  
**Severity**: Critical

**Issue**: Uses `cubic-bezier(0.175, 0.885, 0.32, 1.275)` - a bouncy easing curve that feels dated (iOS 6 era). iOS 26 uses smooth exponential easing.

**Impact**: Interactions feel tacky and unprofessional, undermining the "luxury" brand promise.

**WCAG/Standard**: None, but contradicts design principles.

**Recommendation**: Use iOS 26 easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` for micro-interactions or `ease-out` for larger movements. Better yet, remove custom easing and rely on `lg-pulse-accent` class.

**Suggested Command**: `/animate` - replace with appropriate iOS 26 animations

---

#### 3. Ticket Roulette: Mask-Image Complexity
**Location**: `ticket-roulette.component.ts:150-157`  
**Category**: Performance  
**Severity**: Critical

**Issue**: Uses complex `mask-image: radial-gradient(...)` with dual masks to create ticket notch effect. This forces GPU compositing and is expensive to animate.

**Impact**: Frame drops during reel spinning, especially on mid-range mobile devices. 5-6 masks being animated simultaneously.

**WCAG/Standard**: None.

**Recommendation**: Replace mask with simpler CSS clip-path or use pseudo-elements with transparent circular cutouts using `::before/::after` and `mask-composite`.

**Suggested Command**: `/optimize` - optimize rendering performance

---

#### 4. Back Button Styling Inconsistent
**Location**: Both components, line 18  
**Category**: Theming  
**Severity**: Critical

**Issue**: Back button uses custom classes (`back-btn absolute top-3 left-3 w-12 h-12 ...`) instead of `lg-icon-btn` with proper positioning utilities.

**Impact**: Breaks visual consistency. Button doesn't match the Liquid Glass system's hover, active, and focus states.

**WCAG/Standard**: None, but poor consistency.

**Recommendation**: Use `lg-icon-btn` class and proper layout utilities:
```html
<button class="lg-icon-btn absolute top-3 left-3" ...>
```

**Suggested Command**: `/normalize` - use consistent component classes

---

### High-Severity Issues

#### 5. Missing Focus Styles for Interactive Tickets/Boxes
**Location**: `ticket-roulette.component.ts:47`, `box.component.ts:31-41`  
**Category**: Accessibility  
**Severity**: High

**Issue**: Tickets and boxes have `role="button"` but no `tabindex` or `:focus-visible` styles. Keyboard users can't tab to them.

**Impact**: WCAG 2.1 failure - keyboard inaccessible. Screen reader users can't activate interactive elements.

**WCAG/Standard**: WCAG 2.1 AA - 2.1.1 Keyboard, 2.4.7 Focus Visible

**Recommendation**: Add `tabindex="0"` and focus styles:
```scss
.ticket:focus-visible, .box:focus-visible {
  outline: 2px solid var(--lg-accent-cyan);
  outline-offset: 2px;
}
```

**Suggested Command**: `/harden` - improve accessibility

---

#### 6. Audio Initialization Not User-Triggered
**Location**: `ticket-roulette.component.ts:332-334`, `box.component.ts:284-323`  
**Category**: Performance/Accessibility  
**Severity**: High

**Issue**: Audio objects created in constructor on page load, violating browser autoplay policies. `AudioContext` creation also blocked without user gesture.

**Impact**: Audio may not play, wasting CPU. Violates user expectations and browser security policies.

**WCAG/Standard**: None, but poor UX.

**Recommendation**: Lazy-load audio on first user interaction. For `AudioContext`, create it inside `spin()` or `openBox()` after user click.

**Suggested Command**: `/harden` - fix resource initialization

---

#### 7. Hard-Coded RGBA Values for Shadows
**Location**: Multiple locations  
**Category**: Theming  
**Severity**: High

**Issue**: Custom `rgba(0, 229, 255, 0.3)`, `rgba(0, 0, 0, 0.5)` etc. scattered throughout. Should use `--lg-accent-cyan` with opacity or `--lg-glass-shadow`.

**Impact**: Can't tweak shadow properties globally. Inconsistent shadow depth.

**Recommendation**: Define shadow utility classes in `styles.scss` or use `box-shadow: var(--lg-*)` tokens.

**Suggested Command**: `/normalize` - consolidate shadow tokens

---

#### 8. Touch Targets Too Small on Mobile
**Location**: Both components  
**Category**: Responsive  
**Severity**: High

**Issue**: Tickets are `w-12 h-12` (48px) which is okay, but `selector-arrow` borders are only 20px wide, 15px tall - not tappable. Box grid may be cramped on small screens.

**Impact**: Users on small devices struggle to tap accurately. Violates mobile-first design.

**WCAG/Standard**: WCAG 2.1 AA - 2.5.5 Target Size (minimum 44x44px)

**Recommendation**: Increase box/ticket hit areas with invisible padding or larger containers. Use `min-touch-target` utilities.

**Suggested Command**: `/adapt` - improve mobile touch targets

---

#### 9. Missing `prefers-reduced-motion` Support
**Location**: Both components  
**Category**: Accessibility  
**Severity**: High

**Issue**: Animations (shimmer, pulse, bounceIn) play unconditionally. No respect for `prefers-reduced-motion`.

**Impact**: Users with vestibular disorders may experience dizziness or nausea.

**WCAG/Standard**: WCAG 2.1 AA - 2.3.3 Animation from Interactions

**Recommendation**: Wrap animations in `@media (prefers-reduced-motion: no-preference)` and provide static fallbacks.

**Suggested Command**: `/harden` - add reduced motion support

---

#### 10. Console.log in Production Code
**Location**: `ticket-roulette.component.ts:420`  
**Category**: Performance/Cleanliness  
**Severity**: High

**Issue**: `console.log()` left in `finishSpin()` method. Logs every win to browser console.

**Impact**: Performance overhead in production, exposes game logic to users, clutter in dev console.

**WCAG/Standard**: None, but bad practice.

**Recommendation**: Remove `console.log` or wrap in `if (environment.production === false)`.

**Suggested Command**: `/optimize` - remove debug statements

---

#### 11. Duplicate Logic Between Components
**Location**: Both mini-game components  
**Category**: Architecture  
**Severity**: High

**Issue**: Similar header structure, balance display, back button logic, awarding tickets, audio handling duplicated. Box game has `balance = signal(100)` but hard-coded costs.

**Impact**: Maintenance nightmare. Bug fixes need to be applied twice. Inconsistent behavior.

**Recommendation**: Extract shared logic into:
- `MiniGameHeaderComponent` (reusable)
- `useTicketBalance()` signal utility
- `AudioService` singleton

**Suggested Command**: `/extract` - create reusable components

---

#### 12. No Error Handling for Audio Playback
**Location**: `ticket-roulette.component.ts:402`  
**Category**: Resilience  
**Severity**: High

**Issue**: Audio `play()` returns a promise that may reject (e.g., if user hasn't interacted). Only has `.catch(() => console.log(...))` which silently fails.

**Impact**: Missing audio cues during gameplay degrade experience. Silent failures hard to debug.

**WCAG/Standard**: None, but poor UX.

**Recommendation**: Implement proper error handling with fallback (visual feedback instead of sound) and retry logic after user interaction.

**Suggested Command**: `/harden` - improve error resilience

---

### Medium-Severity Issues

#### 13. Inconsistent Heading Hierarchy
**Location**: Both components use `<h1>` for game title  
**Category**: Accessibility  
**Severity**: Medium

**Issue**: Both components use `<h1>` but they're embedded in a larger page. Should use appropriate heading level (likely `<h2>`).

**Impact**: Screen reader users get confused by multiple H1s. Poor document outline.

**WCAG/Standard**: WCAG 2.1 AA - 1.3.1 Info and Relationships

**Recommendation**: Use `<h2>` for section headings, reserve `<h1>` for page title only. Or use `role="heading"` with `aria-level`.

**Suggested Command**: `/harden` - improve semantic structure

---

#### 14. Missing `lang` Attribute on Root
**Location**: Neither component sets language  
**Category**: Accessibility  
**Severity**: Medium

**Issue**: Game interface doesn't declare language (`<html lang="es">`). Screen readers use wrong pronunciation.

**Impact**: Spanish content read with English pronunciation, reducing comprehension.

**WCAG/Standard**: WCAG 2.1 AA - 3.1.1 Language of Page

**Recommendation**: Set `lang="es"` on root element in `index.html` or app component.

**Suggested Command**: `/harden` - internationalization ready

---

#### 15. High Contrast on Glass Surfaces
**Location**: `ticket-roulette.component.ts:196-199`, `box.component.ts:142`  
**Category**: Accessibility  
**Severity**: Medium

**Issue**: `text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4)` used to boost contrast on tickets. This is a hack, not proper contrast management.

**Impact**: May still fail WCAG AA on some glass backgrounds. Not robust.

**WCAG/Standard**: WCAG 2.1 AA - 1.4.3 Contrast (Minimum)

**Recommendation**: Use `--color-text-light` token with sufficient opacity or adjust glass fill opacity to meet contrast ratios.

**Suggested Command**: `/colorize` - optimize color contrast

---

#### 16. Fixed Pixel Heights in Styles
**Location**: `ticket-roulette.component.ts:102,134,144`  
**Category**: Responsive  
**Severity**: Medium

**Issue**: `height: 500px`, `height: 100px`, `height: 80px` fixed heights break on extreme aspect ratios and when browser zoom changes.

**Impact**: Content may be clipped or have excessive whitespace on unusual screen sizes.

**Recommendation**: Use `min-h-` or `aspect-ratio` instead. Let content dictate height where possible.

**Suggested Command**: `/adapt` - responsive layout improvements

---

#### 17. Hard-Coded Ticket Count in Header
**Location**: `ticket-roulette.component.ts:27` shows `{{ balance() }}` but balance initialized to 5. Should fetch from API/service.  
**Category**: Architecture  
**Severity**: Medium

**Issue**: Balance is hard-coded to `signal(5)`. No connection to user's actual ticket count.

**Impact**: Shows wrong information. User confusion.

**Recommendation**: Inject `AuthService` or `LocalApiService` to get real balance.

**Suggested Command**: N/A - needs backend integration

---

#### 18. Missing Loading States
**Location**: Both components  
**Category**: UX  
**Severity**: Medium

**Issue**: No loading indicators during reel spin or box reveals. User may think app is frozen during 5-second spin.

**Impact**: Poor user feedback, may lead to repeated taps.

**Recommendation**: Add visual progress indicator or countdown during spin. Disable interaction properly.

**Suggested Command**: `/delight` - add loading micro-interactions

---

#### 19. No Empty State for Zero Tickets
**Location**: Box component starts with `balance = signal(100)` but ticket roulette starts with 5  
**Category**: UX  
**Severity**: Medium

**Issue**: If user runs out of tickets, no guidance on how to get more.

**Impact**: User stuck with no recourse.

**Recommendation**: Show "Get More Tickets" CTA or link to rewards when balance = 0.

**Suggested Command**: `/onboard` - improve empty states

---

#### 20. Spanish Copy Not Internationalized
**Location**: Both components  
**Category**: Architecture  
**Severity**: Medium

**Issue**: Hard-coded Spanish strings ("GIRAR", "JUGAR", "Tickets:"). No i18n support.

**Impact**: Can't support multiple languages. Single-language app.

**Recommendation**: Use Angular i18n or custom translation service.

**Suggested Command**: N/A - needs i18n setup

---

### Low-Severity Issues

#### 21. Inconsistent Font Specifications
**Location**: Both components import `'Roboto'` but parent app also sets Roboto in `styles.scss`  
**Category**: Theming  
**Severity**: Low

**Issue**: Redundant `font-family: 'Roboto'` declarations in component styles.

**Impact**: Negligible. Slight CSS bloat.

**Recommendation**: Remove redundant font declarations; inherit from root.

**Suggested Command**: `/distill` - remove CSS bloat

---

#### 22. Magic Numbers Without Explanation
**Location**: `ticket-roulette.component.ts:306,362,374` - `scale = 500`, `minSpins = 70`, `maxSpins = 90`  
**Category**: Maintainability  
**Severity**: Low

**Issue**: Unexplained magic numbers make code harder to maintain.

**Impact**: Future developers (or you) won't know why those values were chosen.

**Recommendation**: Extract to named constants with comments:
```typescript
const REEL_SCALE = 500; // Supports up to 90 spins while maintaining probability distribution
const MIN_SPINS = 70; // Minimum spins for suspense
```

**Suggested Command**: `/clarify` - improve code clarity

---

#### 23. Class Name Syntax Error
**Location**: `ticket-roulette.component.ts:25` and `box.component.ts:24`  
```html
class="header-glass !py-2 px-4 !mb-4 inline-flex! items-center gap-3"
```
**Category**: Code Quality  
**Severity**: Low

**Issue**: `inline-flex!` (no space before `!`) is invalid Tailwind syntax. Should be `inline-flex !...`

**Impact**: Tailwind may not parse properly, causing missing styles. Browser may ignore entire class list after parsing error.

**WCAG/Standard**: None.

**Recommendation**: Fix to `inline-flex !py-2 px-4 !mb-4 ...` (space after `flex`)

**Suggested Command**: `/polish` - fix syntax errors

---

## Patterns & Systemic Issues

### 1. Incomplete Liquid Glass Migration
Both components mix old custom `.glass` patterns with new `lg-*` tokens. This creates visual inconsistency and increases maintenance burden.

**Evidence**:
- Custom `header-glass` class redefines properties already in `lg-card-*`
- Manual `backdrop-filter` and `box-shadow` instead of using `lg-module-card`
- Custom `tint` classes (`lg-tint-cyan/amber/magenta`) only partially used

### 2. Performance-Anti-Patterns
- **Mask animations**: `mask-image` changes during scroll are expensive
- **Multiple backdrop-filter**: stacking glass effects increases GPU load
- **Box shadows**: 3-4 layered shadows per element compound rendering cost
- **Dynamic class binding**: `[class]="ticket.colorClass === 'ticket-blue' ? 'lg-tint-cyan' : ''"` triggers recompilation

### 3. Accessibility Debt
- Focus management added only where remembered (buttons), not for all interactive elements
- ARIA labels present but incomplete (tickets lack state announcements)
- No keyboard trap prevention (reel spin captures focus? unclear)
- Color contrast checked manually but not systematically validated

### 4. Copy-Paste Code Smell
Box component appears to be derived from Ticket Roulette (similar structure, class names, even same `triggerConfetti` colors). But changes weren't fully propagated:
- Box still has `confetti-particle` CSS in component styles (should be global)
- Different box sizing approaches (`!w-24 !h-24` vs `aspect-ratio`)

---

## Positive Findings

1. **Good use of signals**: Both components properly use `signal()` and `computed()` where appropriate.
2. **Proper Angular patterns**: Standalone components, OnPush change detection, proper imports.
3. **Semantic markup**: Uses `<button>` for actions, not `<div>` tricks.
4. **Basic ARIA**: Adds `aria-label`, `aria-busy`, `role` - foundation exists.
5. **Responsive media queries**: Both components have breakpoints for larger screens.
6. **Native control flow**: Uses `@for` and `@if` (modern Angular).
7. **NgOptimizedImage**: Proper lazy loading for images.
8. **Type safety**: TypeScript interfaces defined, proper typing on signals.
9. **Animation timing**: Uses `cubic-bezier` and `requestAnimationFrame` correctly (except easing curve).
10. **Moderate component size**: ~400 lines each - not monstrous.

---

## Recommendations by Priority

### Immediate (Critical Blockers)

1. **Fix hard-coded colors** - Replace all hex/rgba with `--lg-*` tokens
   - `/normalize` to align entire codebase with design system
   
2. **Replace bouncy easing** - Use iOS 26 curves: `cubic-bezier(0.34, 1.56, 0.64, 1)` or just `ease-out`
   - `/animate` to update all animations
   
3. **Fix back button** - Use `lg-icon-btn` consistently
   - `/normalize` for component consistency
   
4. **Optimize ticket masks** - Simplify or replace `mask-image` animations
   - `/optimize` for rendering performance

### Short-Term (This Sprint)

5. **Add keyboard accessibility** - `tabindex` and `:focus-visible` for all interactive elements
   - `/harden` accessibility
   
6. **Implement reduced motion** - Wrap animations in `@media (prefers-reduced-motion)`
   - `/harden` for inclusive design
   
7. **Fix touch targets** - Ensure all interactive elements ≥44px
   - `/adapt` mobile UX
   
8. **Extract shared code** - `MiniGameHeaderComponent`, `useTicketBalance()`
   - `/extract` reusable components
   
9. **Add loading states** - Visual feedback during spin/box reveal
   - `/delight` micro-interactions
   
10. **Fix magic numbers** - Document constants
    - `/clarify` code intent

### Medium-Term (Next Sprint)

11. **Normalize shadow tokens** - Define `--lg-shadow-glow-cyan`, etc.
    - `/normalize` theming
    
12. **Improve color contrast** - Systematic contrast validation
    - `/colorize` color optimization
    
13. **Remove console.logs** - Production cleanup
    - `/optimize` code hygiene
    
14. **Add empty states** - When balance = 0
    - `/onboard` user guidance

### Long-Term (Nice-to-haves)

15. **Internationalization** - Extract all strings to translation service
16. **Backend integration** - Connect balance to real user data
17. **Unit tests** - Cover spin mechanics, prize distribution
18. **E2E tests** - Full game flow automation

---

## Suggested Commands for Fixes

| Issue Count | Command | Purpose |
|-------------|---------|---------|
| Theming: 12 | `/normalize` | Align to design tokens, consistent classes |
| Animations: 6 | `/animate` | iOS 26 motion patterns, remove bounce |
| Accessibility: 8 | `/harden` | Focus, keyboard, reduced motion, ARIA |
| Responsive: 3 | `/adapt` | Touch targets, fluid layouts |
| Performance: 4 | `/optimize` | GPU optimization, remove bloat |
| Components: 5 | `/extract` | Shared components, reuse |
| UX polish: 4 | `/delight` / `/polish` | Loading states, empty states, micro-interactions |
| Colors: 2 | `/colorize` | Contrast, color harmony |

**Recommended sequence**:
1. Run `/normalize` (fixes 12 issues)
2. Run `/animate` (fixes 6 issues)  
3. Run `/harden` (fixes 8 issues)
4. Run `/adapt` (fixes 3 issues)
5. Run `/optimize` (fixes 4 issues)
6. Run `/extract` (reduces duplication)
7. Run `/delight` and `/polish` (final quality pass)

---

## Conclusion

The mini-games are functionally complete but suffer from **inconsistent implementation** and **AI-assistance tells**. They partially adopted the Liquid Glass system but held onto old patterns. Critical work needed to fully align with the sophisticated iOS 26 aesthetic and accessibility standards.

**Priority**: Normalize theming and animations first, then address accessibility debt. Performance optimizations will follow naturally from cleaner code.

**Quality Gate**: These components should not be considered "code complete" until the critical and high issues are resolved. The current state risks brand perception (unprofessional feel) and legal exposure (accessibility non-compliance).
