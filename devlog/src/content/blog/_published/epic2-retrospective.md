---
title: "Epic 2 Complete — The Foundation Takes Shape"
description: "Base layout, navigation, and the art of making scout leaders feel at home in a digital world"
pubDate: 2025-01-28
tags: [devlog, epic-complete, ui-layout, navigation, branding]
scoutingContext: "How this helps leaders navigate and use the platform more effectively"
epicNumber: 2
epicName: "UI Layout & Navigation"
status: published
heroImage: /src/assets/epic2-cover.png
---

## The Foundation Takes Shape 🏗️

Continuing on the work done in Epic 1, where we scaffolded the project and set the groundwork for an amazing construction, Epic 2 has given us the structural integrity we need to build something truly useful.

## What We Built

### The Navigation That Actually Works

Sometimes the best solutions come from asking 'what would a scout leader actually need?' rather than 'what's the most elegant code?' The answer, as it turns out, is a navigation system that doesn't make you want to throw your laptop into the nearest lake.

We started with the basics—a header that actually stays where you put it:

```tsx
export function Header() {
  const { data: session } = useSession();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image
              src="/logo_escoteiros.png"
              alt="Escoteiros de Portugal"
              width={40}
              height={40}
              className="h-10 w-10"
              unoptimized
            />
            <span className="hidden font-bold sm:inline-block">
              Kit de Atividades
            </span>
          </Link>
        </div>
        {/* Navigation items */}
      </div>
    </header>
  );
}
```

The key insight here? Scout leaders need to know where they are and where they're going, just like when they're leading a patrol through unfamiliar territory. The sticky header with backdrop blur gives that sense of stability—you're never lost, even when scrolling through endless activity lists.

### Mobile-First Thinking (Because Scout Leaders Are Always Moving)

We implemented a responsive design that actually works on mobile devices, because let's face it, scout leaders are more likely to be checking their programs while herding kids at a campsite than sitting at a desk.

```tsx
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

// Mobile hamburger menu
<Button
  variant="ghost"
  className="md:hidden"
  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
>
  <Menu className="h-6 w-6" />
</Button>

// Mobile navigation drawer
{isMobileMenuOpen && (
  <div className="absolute top-full left-0 right-0 bg-background border-b md:hidden">
    <nav className="flex flex-col p-4 space-y-2">
      {navigationItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="px-3 py-2 rounded-md hover:bg-accent"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  </div>
)}
```

The mobile menu closes automatically when you tap a link—because nothing is more frustrating than trying to navigate with a menu that refuses to go away, especially when you're trying to show something to a curious scout.

### Branding That Actually Makes Sense

We discovered that the Escoteiros de Portugal logo needed to be treated with the respect it deserves. The `unoptimized` prop on the Next.js Image component ensures the logo maintains its integrity:

```tsx
<Image
  src="/logo_escoteiros.png"
  alt="Escoteiros de Portugal"
  width={40}
  height={40}
  className="h-10 w-10"
  unoptimized
/>
```

This prevents Next.js from trying to "optimize" a logo that's already been carefully crafted by professionals who understand the importance of brand consistency.

### The Language That Feels Right

We switched from formal Portuguese to informal throughout the interface. This wasn't just a linguistic choice—it was about creating a platform that feels like it was built by someone who actually understands scout culture.

**Before (formal):**
- "Navegue por centenas de atividades"
- "Crie programas personalizados"
- "Os seus escuteiros"

**After (informal):**
- "Navega por centenas de atividades"
- "Cria programas personalizados"
- "Os teus escoteiros"

The informal "tu" form creates a more personal, friendly tone that matches how scout leaders actually talk to each other. It's the difference between a formal meeting and a conversation around the campfire.

## The Human Touch

### The Spelling Incident

We had a critical moment when we discovered we'd been using "escuteiros" instead of "escoteiros" throughout the codebase. In the Portuguese Scouts, this is like calling someone by the wrong name—it's not just incorrect, it's disrespectful.

The fix was simple but important:

```bash
# Find and replace the incorrect spelling
git grep -l "escuteiros" | xargs sed -i 's/escuteiros/escoteiros/g'
```

This taught us the importance of having proper project standards documented. We now have a `.cursorrules` file that ensures everyone working on the project knows the critical terminology.

### The Tailwind CSS Saga

We went through a brief but intense period where the styling completely broke after removing the internationalization folder. The solution? Downgrading from Tailwind CSS v4 (beta) to the stable v3.4.0:

```bash
npm uninstall tailwindcss
npm install tailwindcss@3.4.0
```

Sometimes the most elegant solution is the stable one. Scout leaders don't need bleeding-edge CSS features—they need a platform that works reliably.

## What's Next 🚀

With Epic 2 complete, we now have a solid foundation that actually looks and feels like a professional platform. The next phase will focus on the activities browsing system—the heart of what makes this platform useful.

We'll be building:
- Activity cards that show all the information leaders need at a glance
- Search and filtering that doesn't make you want to tear your hair out
- A table view for those who prefer to see everything in organized rows
- Detailed activity pages that give the full picture

The foundation is solid. Now we can build the features that will actually make scout leaders' lives easier.

---

*This post was generated by the AI model used in this project, with human review and fine-tuning to ensure accuracy and tone consistency. The technical details and scouting context have been validated to match the actual implementation.*
