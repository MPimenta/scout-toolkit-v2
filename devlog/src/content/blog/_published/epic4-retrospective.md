---
title: "Epic 4 Complete — The Program Builder's Pocket Watch"
description: "Drag and drop, time calculations, and the art of making scout leaders feel like they have a magic wand for program planning"
pubDate: 2025-09-06
tags: [devlog, epic-complete, program-builder, drag-drop, mobile-responsive]
scoutingContext: "How this epic transforms chaotic program planning into organized, visual timeline management"
epicNumber: 4
epicName: "Program Builder"
heroImage: /src/assets/epic4-cover.png
status: published
---

## The Program Builder's Pocket Watch 🕰️

In the world of scouting, where every leader juggles the impossible task of keeping 20 kids engaged while secretly hoping they learn something useful, the Program Builder has discovered that time only loops if you forget to recompute end times. We gave it a pocket watch and a quiet word.

Another epic completed! This time we tackled **Program Builder** and learned some valuable lessons along the way—like how drag and drop can make even the most chaotic program planning feel like conducting a symphony.

## What We Built 🏗️

Sometimes the best solutions come from asking 'what would a scout leader actually need?' rather than 'what's the most elegant code?' The Program Builder answers that question with a resounding "a visual timeline that doesn't make me want to throw my laptop out the window."

### Core Functionality
- ✅ **Program CRUD Operations** - Full create, read, update, delete functionality for programs
- ✅ **Program Builder Interface** - Drag and drop reordering with @dnd-kit
- ✅ **Schedule Display** - Table-based layout with time calculations and mobile responsiveness
- ✅ **Add to Program** - Seamless integration from activity browsing to program building
- ✅ **Fine-tuning** - Icon-only display for taxonomy values and expand/collapse functionality
- ✅ **PostgreSQL Testing** - Standardized testing infrastructure with proper isolation

### The Magic Behind the Scenes

```typescript
// Auto-calculating time slots like a scout leader's internal clock
const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return end.toTimeString().slice(0, 5);
};
```

The Program Builder now understands that time is not just a suggestion—it's a promise to 20 kids who will hold you to it. Every drag and drop operation recalculates the entire timeline, ensuring that when you move "Lunch Break" to after "Treasure Hunt," the universe doesn't collapse.

## The Human Touch 🎯

### Technical Insights That Matter

**@dnd-kit Integration** - Like teaching a particularly stubborn mule to dance, @dnd-kit is powerful but requires patience. It handles the complex physics of drag and drop beautifully, but HTML validation gets a bit grumpy about the dynamic attributes it adds. We learned to embrace the warnings and focus on the magic.

```bash
# The moment when drag and drop finally worked
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
# Result: Scout leaders can now rearrange programs like they're organizing their sock drawer
```

**Time Calculations** - The Program Builder now has the internal clock of a scout leader who's been doing this for 20 years. It knows that "30 minutes" means "30 minutes unless someone gets lost, in which case it's 45 minutes and a search party." Every time you drag an activity, it recalculates the entire timeline, ensuring continuity.

**Mobile Responsiveness** - Because scout leaders plan programs everywhere—in the car, during meetings, while hiding from their patrol—the table scrolls horizontally on mobile like a scroll of ancient wisdom. It's not perfect, but it's better than trying to read a spreadsheet on a phone.

### Scouting Context: Why This Matters

**Visual Schedule** - The table layout transforms abstract program planning into something tangible. Leaders can see their program as a timeline, just like they'd sketch on paper, but with the added benefit of not losing the paper.

**Drag & Drop** - There's something deeply satisfying about dragging "Lunch Break" to after "Treasure Hunt" and watching the entire schedule adjust. It's like having a personal assistant who actually understands your chaotic thought process.

**Quick Add** - Being able to add activities directly from browsing means leaders can discover an activity and immediately slot it into their program. It's the difference between "I'll remember this later" and "I'll add it now before I forget."

**Mobile-First** - Leaders often plan programs on their phones during meetings, in the car, or while pretending to listen to district announcements. The mobile experience had to work, or it wouldn't get used.

### Challenges Overcome

**Test Isolation Issues** - PostgreSQL test database conflicts were like trying to organize a camp where everyone wants to use the same tent. We learned that test isolation isn't just a nice-to-have—it's essential for sanity. The solution involved proper database cleanup and unique test data generation.

**Type Safety** - SDG icon consistency between activities and programs was like having two different maps to the same treasure. We fixed the type definitions and API responses to ensure the same icons appear everywhere, because consistency is the scout leader's best friend.

**Performance** - Database queries were running like a patrol on a hot day—slow and grumpy. We optimized the queries and added proper indexing, making the Program Builder respond like a well-trained scout: quickly and efficiently.

**User Experience** - Fine-tuning the interface based on real usage patterns revealed that scout leaders need information at a glance. The icon-only display for taxonomy values saves space while maintaining clarity, and the expand/collapse functionality keeps the interface clean.

## What's Next 🔮

And so we reach the end of another epic, like a patrol returning from a successful expedition—tired, wiser, and with slightly fewer socks than we started with.

**Epic 5: Code Quality & Architecture Refactoring** - Time to clean up the camp and make sure everything is properly organized. We'll be consolidating types, standardizing error handling, and making the codebase more maintainable. Think of it as teaching the Program Builder to put its tools away properly.

**Epic 6: Export Functionality** - Because scout leaders need to share their programs with other leaders, print them for offline use, or show them to parents who want to know what their kids will be doing. The Program Builder will learn to speak Excel and PDF.

**User Feedback** - We'll be gathering input from real scout leaders to understand how the Program Builder fits into their actual workflow. Because the best code is the code that actually gets used.

---

*This post was generated by the AI development assistant with human review and enhancement, following the Terry Pratchett-inspired tone guidelines for the Scout Toolkit devlog. The technical insights and scouting context were carefully crafted to bridge the gap between code and the real world of scouting.*
