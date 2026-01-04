# QA Testing Dashboard - Animations & Effects

**Version:** 1.0  
**Purpose:** Tasteful motion design - functional, not decorative  
**Last Updated:** January 2026

---

## 1. CORE LIBRARIES

```bash
npm install framer-motion @gsap/react gsap
```

---

## 2. PAGE TRANSITIONS

```tsx
// Subtle fade + slide for page changes
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 }
};

<motion.div
  variants={pageVariants}
  initial="initial"
  animate="animate"
  exit="exit"
  transition={{ duration: 0.2 }}
>
  {children}
</motion.div>
```

---

## 3. TABLE ANIMATIONS

### Row Stagger (on load)
```tsx
const tableVariants = {
  animate: { transition: { staggerChildren: 0.03 } }
};

const rowVariants = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 }
};
```

### Row Hover
```tsx
<motion.tr
  whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
  transition={{ duration: 0.15 }}
/>
```

### Expandable Row Details
```tsx
<AnimatePresence>
  {expanded && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
    />
  )}
</AnimatePresence>
```

---

## 4. STATS CARDS

### Number Counter
```tsx
import { useSpring, animated } from '@react-spring/web';

function AnimatedNumber({ value }) {
  const { number } = useSpring({
    from: { number: 0 },
    number: value,
    config: { duration: 800 }
  });
  return <animated.span>{number.to(n => Math.floor(n))}</animated.span>;
}
```

### Card Hover
```tsx
<motion.div
  whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
  transition={{ duration: 0.2 }}
  className="stats-card"
/>
```

---

## 5. STATUS INDICATORS

### Running Test Pulse
```css
.status-running {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### Pass/Fail Badge
```tsx
<motion.span
  initial={{ scale: 0.8 }}
  animate={{ scale: 1 }}
  className={status === 'pass' ? 'badge-pass' : 'badge-fail'}
/>
```

---

## 6. PROCESS CARDS

### Active Process Glow
```css
.process-running {
  box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.3),
              0 0 20px rgba(139, 92, 246, 0.1);
}
```

### Progress Bar
```tsx
<motion.div
  className="progress-bar"
  initial={{ width: 0 }}
  animate={{ width: `${progress}%` }}
  transition={{ duration: 0.3 }}
/>
```

---

## 7. BUTTONS & INTERACTIONS

### Button Press
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.1 }}
/>
```

### Dropdown Menu
```tsx
<motion.div
  initial={{ opacity: 0, y: -8, scale: 0.95 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: -8, scale: 0.95 }}
  transition={{ duration: 0.15 }}
/>
```

---

## 8. TOAST NOTIFICATIONS

```tsx
const toastVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 }
};

// Auto-dismiss with progress bar
<motion.div className="toast-progress"
  initial={{ width: "100%" }}
  animate={{ width: 0 }}
  transition={{ duration: 3, ease: "linear" }}
/>
```

---

## 9. LOADING STATES

### Skeleton Shimmer
```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.03) 0%,
    rgba(255,255,255,0.08) 50%,
    rgba(255,255,255,0.03) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Spinner
```tsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  className="spinner"
/>
```

---

## 10. GUIDELINES

**DO:**
- Use 0.15-0.2s for micro-interactions
- Stagger table rows at 0.03s intervals
- Add subtle hover states to clickable elements
- Animate status changes (pass/fail/running)

**DON'T:**
- Animate everything
- Use durations > 0.3s for UI elements
- Add bounce/spring to data tables
- Distract from information with motion

---

**ANIMATIONS SPEC COMPLETE** ✓
