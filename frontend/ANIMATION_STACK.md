# Animation Stack for MERCAN

This document outlines the combined animation stack implemented for the MERCAN project, following best practices for performance and consistency.

## Base Layer (Required)

### Framer Motion
- **Status**: ✅ Installed
- **Use**: Animation engine powering all components
- **Documentation**: [framer.com/motion](https://framer.com/motion)

### Tailwind CSS
- **Status**: ✅ Configured
- **Use**: Utility-first CSS framework for styling
- **Documentation**: All components use Tailwind for minimal style conflicts

## Component Libraries

### 1. Aceternity UI
**Best for**: Hero effects, backgrounds, and timelines

#### Components Included:
- **Spotlight** - Hero background effect
  ```jsx
  import { Spotlight } from '@/components/ui/aceternity'

  <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="blue" />
  ```

- **ParallaxScroll** - Smooth parallax scrolling for image galleries
  ```jsx
  import { ParallaxScroll } from '@/components/ui/aceternity'

  <ParallaxScroll images={imageArray} className="w-full" />
  ```

- **TracingBeam** - Animated timeline/progress indicator
  ```jsx
  import { TracingBeam } from '@/components/ui/aceternity'

  <TracingBeam>
    <div>Your timeline content here</div>
  </TracingBeam>
  ```

### 2. Magic UI
**Best for**: Counters, beams, borders, and marquees

#### Components Included:
- **AnimatedCounter** - Number counter for stats
  ```jsx
  import { AnimatedCounter } from '@/components/ui/magic'

  <AnimatedCounter value={1000} className="text-4xl font-bold" />
  ```

- **BorderBeam** - Animated border effect for cards
  ```jsx
  import { BorderBeam } from '@/components/ui/magic'

  <div className="relative rounded-lg p-6">
    <BorderBeam size={200} duration={12} />
    <p>Card content</p>
  </div>
  ```

- **ShineButton** - CTA button with shine effect
  ```jsx
  import { ShineButton } from '@/components/ui/magic'

  <ShineButton onClick={handleClick}>
    Get Started
  </ShineButton>
  ```

- **Marquee** - Partner logos carousel
  ```jsx
  import { Marquee } from '@/components/ui/magic'

  <Marquee pauseOnHover className="[--duration:20s]">
    <img src="logo1.png" />
    <img src="logo2.png" />
    <img src="logo3.png" />
  </Marquee>
  ```

### 3. Luxe
**Best for**: Premium subtle animations

#### Components Included:
- **TextShimmer** - Shimmer effect for headings
  ```jsx
  import { TextShimmer } from '@/components/ui/luxe'

  <TextShimmer className="text-5xl font-bold">
    Welcome to MERCAN
  </TextShimmer>
  ```

- **AnimatedTabs** - Program selector with smooth transitions
  ```jsx
  import { AnimatedTabs } from '@/components/ui/luxe'

  const tabs = [
    { id: 'tab1', label: 'Overview', content: <div>Content 1</div> },
    { id: 'tab2', label: 'Features', content: <div>Content 2</div> }
  ]

  <AnimatedTabs tabs={tabs} />
  ```

- **FadeText** - Fade-in animation for testimonials
  ```jsx
  import { FadeText } from '@/components/ui/luxe'

  <FadeText direction="up" delay={0.2}>
    <p>Customer testimonial...</p>
  </FadeText>
  ```

### 4. Custom Framer Motion
**Best for**: Page transitions, scroll reveals, and custom animations

#### Components Included:
- **PageTransition** - Smooth page transitions
  ```jsx
  import { PageTransition, PageTransitionWrapper } from '@/components/ui/framer'

  // In App.jsx
  <PageTransitionWrapper>
    <Routes>
      <Route path="/" element={
        <PageTransition>
          <HomePage />
        </PageTransition>
      } />
    </Routes>
  </PageTransitionWrapper>
  ```

- **ScrollReveal** - Reveal elements on scroll
  ```jsx
  import { ScrollReveal } from '@/components/ui/framer'

  <ScrollReveal direction="up" delay={0.1}>
    <div>Content revealed on scroll</div>
  </ScrollReveal>
  ```

## Potential Issues When Combining

### Issue: Duplicate code
**Solution**: Each library may have similar utilities. Keep one version, delete duplicates.

### Issue: Style conflicts
**Solution**: All use Tailwind, so minimal conflicts. Check for CSS variable name clashes.

### Issue: Bundle size
**Solution**: Only import components you use. Don't install full packages.

### Issue: Consistency
**Solution**: Pick one style direction:
- **Luxe + Magic UI** = premium feel
- **Avoid mixing** techy Aceternity with Luxe

### Issue: Performance
**Solution**: Too many animations = slow page
- Use sparingly: hero, stats, CTA only
- Avoid animations on every element

## Usage Guidelines

1. **Hero Section**: Use Aceternity Spotlight background
2. **Stats Section**: Use Magic UI AnimatedCounter
3. **Cards**: Use Magic UI BorderBeam
4. **CTA Buttons**: Use Magic UI ShineButton
5. **Headings**: Use Luxe TextShimmer sparingly
6. **Tabs/Navigation**: Use Luxe AnimatedTabs
7. **Testimonials**: Use Luxe FadeText
8. **Partner Logos**: Use Magic UI Marquee
9. **Timelines**: Use Aceternity TracingBeam
10. **Page Transitions**: Use Custom PageTransition
11. **Content Reveals**: Use Custom ScrollReveal

## Quick Import

```jsx
// Import everything
import {
  // Aceternity UI
  Spotlight,
  ParallaxScroll,
  TracingBeam,

  // Magic UI
  AnimatedCounter,
  BorderBeam,
  ShineButton,
  Marquee,

  // Luxe
  TextShimmer,
  AnimatedTabs,
  FadeText,

  // Custom Framer Motion
  PageTransition,
  PageTransitionWrapper,
  ScrollReveal
} from '@/components/ui'
```

## Resources

- **Aceternity UI**: [ui.aceternity.com](https://ui.aceternity.com)
- **Magic UI**: [magicui.design](https://magicui.design)
- **Luxe**: [luxe.goulart.dev](https://luxe.goulart.dev)
- **Framer Motion**: [framer.com/motion](https://framer.com/motion)
- **GSAP**: [gsap.com](https://gsap.com)
- **Awwwards**: [awwwards.com](https://awwwards.com)
- **Dribbble**: [dribbble.com/search/animation](https://dribbble.com/search/animation)
