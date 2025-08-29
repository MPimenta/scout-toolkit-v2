---
title: "Epic 1 Complete — The Foundation Laid"
description: "Authentication, database setup, and the art of making computers understand scout leaders"
pubDate: 2025-01-28
tags: [devlog, epic-complete, authentication, database, internationalization, portuguese-refactor]
scoutingContext: "How this foundation helps leaders manage their groups more effectively"
epicNumber: 1
epicName: "Project Setup & Infrastructure"
status: published
---

## The Journey Begins 🚀

In the world of scouting, where every leader juggles the impossible task of keeping 20 kids engaged while secretly hoping they learn something useful, we've just laid the foundation for something remarkable. Epic 1 is complete, and like a well-organized patrol kit, everything has its place.

## What We Built

### Cursor Project Scaffold 🏗️
This is the second life of a previous project that started in Replit - it is a great platform, but when you want a bigger lifetime, complexity and maintainability, Cursor is the way to go. The thing is that when we shifted to Cursor, we already had a lot of baggage from the original structure, without the best practices that Cursor allows us to define. 

We started with having Cursor define the plan for the project, with the instructions in the docs folder and the summary in the README.md file. We followed that up by defining the set of cursor rules that would allow us to guide Cursor along the best path. This is really key to keep Cursor on track. 

### Repository Scaffold
Having the plan and the guardrails, it was time to start scaffolding. We began with the basics—Next.js 15, TypeScript, and a folder structure that would make even the most organized scout leader proud. The project scaffold is like setting up camp: you need a solid foundation before you can start the real work.

### Database Setup 🗄️
PostgreSQL and Drizzle ORM came together like a well-trained patrol—each knowing their role and working in perfect harmony. The database schema is designed to handle activities, programs, and all the chaos that comes with managing scout groups. We even imported the UN's Sustainable Development Goals (SDGs), because apparently, saving the world is now part of the job description.

### Authentication Setup 🔐
Google sign-in now checks for @escoteiros.pt, like a nightclub bouncer who's read the guest list and your aura. Turn up with a different domain and it smiles kindly, the way innkeepers do when you ask for dragons on a Tuesday: 'Lovely boots; wrong tavern.' The authentication system is robust, secure, and knows exactly who belongs in our digital scout hall.

### The Great Internationalization Adventure (and Its Sequel)
We invited the UN's SDGs in; they arrived with icons and the air of honored relatives. Portuguese speaks first (as is only polite), and now it's the only language we need. The internationalization saga was like trying to teach a very enthusiastic but slightly confused parrot to speak multiple languages—it worked, but the parrot kept getting confused about which language it was supposed to use when.

After successfully implementing the full internationalization system, we encountered some technical challenges with Turbopack and Next.js 15. Like a wise scout leader who knows when to simplify the plan, we decided to focus on what matters most: delivering value to Portuguese scout leaders. The refactor was swift, clean, and now everything works like a well-oiled compass.

### Test Coverage Implementation 🧪
We created 68 tests across 6 test files, achieving 27.2% coverage. While not quite the 80% target we aimed for, it's like having a good first aid kit—you hope you won't need it, but you're glad it's there when you do. The test infrastructure is solid and ready to grow with the project.

### Database Infrastructure Setup
Docker Compose setup for local PostgreSQL, environment configuration, and automated setup scripts. It's like having a portable scout camp that you can set up anywhere. The database is fully functional with seed data loaded, ready for Epic 2 development.

## The Human Touch

The most surprising discovery was how much we learned about the relationship between technical complexity and user value. The internationalization refactor taught us that sometimes the best solution is the simplest one that actually works. Portuguese scout leaders don't need a multilingual interface—they need a reliable tool that helps them manage their groups effectively.

The Cursor rules we established early on proved invaluable. They're like having a wise mentor who keeps you on the right path, even when you're tempted to take shortcuts. The documentation-first approach meant we always had a clear reference for what we were building and why.

## What's Next 🔮

Epic 2 awaits: Core UI & Layout. We'll be building the visual foundation that scout leaders will interact with daily. Think of it as designing the perfect scout hall—functional, welcoming, and organized enough that even the most chaotic patrol can find what they need.

The devlog system is now set up to automatically document our journey, with Terry Pratchett-inspired wit and a focus on how each technical decision helps scout leaders bridge the gap between what kids need and what leaders know.

## Technical Insights

- **Next.js 15 + Turbopack**: Fast development, but some compatibility challenges with complex middleware
- **Auth.js v5 beta**: Excellent authentication system, but requires careful configuration for Next.js 15
- **Drizzle ORM**: Type-safe database operations that make even complex queries feel simple
- **Portuguese-first approach**: Simplified the codebase significantly while focusing on core value delivery
- **Test infrastructure**: Solid foundation for future development, with room for growth

## Scouting Impact

This foundation enables scout leaders to:
- Access a reliable, secure platform for managing activities and programs
- Focus on what matters most—engaging with their scouts—rather than technical complexity
- Have confidence that their data is safe and their tools are dependable
- Build programs that align with educational goals and SDGs

The platform is now ready for the next phase: building the interfaces that will make all this infrastructure truly useful for scout leaders in their daily work.

---

*"The best-laid plans of mice and scout leaders often go awry, but with a solid foundation, even the most chaotic expedition can be a success."*
