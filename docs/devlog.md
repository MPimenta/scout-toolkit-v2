# Devlog System - Automated Blogging with Human Oversight

## Overview

This document outlines the automated devlog system for documenting the Scout Toolkit development journey. The system generates blog content from PRs and git history while maintaining a witty, Terry Pratchett-inspired tone that bridges technical insights with scouting context.

## Goals

- **Automated Content Generation**: Create blog posts from PRs and development progress
- **Scouting Context**: Emphasize how technical decisions help scout leaders
- **Authentic Voice**: Maintain witty, engaging tone throughout
- **Minimal Upkeep**: Smart defaults and templates reduce maintenance
- **Quality Control**: Human validation ensures content quality and tone consistency

## System Architecture

### Content Sources
- **PR Snippets**: Extracted from PR descriptions and comments
- **Git History**: Commit messages, file changes, progress tracking
- **Planning Integration**: Epic completion status from `planning.md`
- **Manual Input**: Human review and enhancement of automated content

### Content Pipeline
1. **Epic Completion** → GitHub Action triggers content generation
2. **Content Created** → Epic summary + git history + scouting insights
3. **Draft Generated** → Markdown with frontmatter and tone templates
4. **Human Review** → PR-based review process for validation
5. **Auto-Publish** → Deployed to GitHub Pages via Astro

## Technical Implementation

### 1. Astro Blog Setup
```
/devlog/
├── src/
│   ├── content/blog/
│   │   ├── _drafts/          # Generated drafts awaiting review
│   │   └── _published/       # Published posts
│   ├── components/
│   │   ├── PostCard.astro
│   │   └── ScoutingContext.astro
│   ├── layouts/
│   │   └── BlogPost.astro
│   └── pages/
├── astro.config.mjs
└── package.json
```

### 2. PR Template Enhancement
```markdown
## What & Why
- [Technical changes]
- [Scouting impact]

## Devlog Snippet (Auto-blog content)
> **Scouting Context**: How this helps leaders bridge the gap between kids' needs and their knowledge
> **Technical Insight**: What we learned, trade-offs, surprises
> **Human Touch**: One witty observation or "aha moment"

## Labels
- `devlog` - Include in automated blog posts
- `scouting-focus` - Emphasize scouting impact
- `architecture` - Technical deep-dive worthy
- `epic-complete` - Mark epic completion
```

### 3. Tone Templates
```javascript
const TONE_TEMPLATES = {
  scouting_focus: "In the world of scouting, where every leader juggles the impossible task of keeping 20 kids engaged while secretly hoping they learn something useful...",
  
  technical_insight: "Sometimes the best solutions come from asking 'what would a scout leader actually need?' rather than 'what's the most elegant code?'",
  
  progress_update: "Another week, another step toward making scout leaders' lives slightly less chaotic...",
  
  epic_completion: "And so we reach the end of another epic, like a patrol returning from a successful expedition—tired, wiser, and with slightly fewer socks than we started with.",
  
  authentication: "Google sign-in now checks for @escoteiros.pt, like a nightclub bouncer who's read the guest list and your aura.",
  
  portuguese_interface: "We invited the UN's SDGs in; they arrived with icons and the air of honored relatives. Portuguese speaks first (as is only polite), and now it's the only language we need.",
  
  search_filters: "We taught the search bar to stop panicking when asked for 'less than 15 minutes but more than my patience.'",
  
  program_builder: "The Program Builder has discovered that time only loops if you forget to recompute end times. We gave it a pocket watch and a quiet word."
}
```

### 4. Content Generation Workflow

#### Epic Completion Posts
- **Trigger**: PR labeled `epic-complete` merged
- **Source**: Epic summary from `planning.md` + git history + related commits
- **Output**: Special completion post with progress overview
- **Review**: Enhanced review process for milestone posts

#### Manual Epic Posts
- **Trigger**: Manual GitHub Action trigger
- **Source**: Git history analysis + planning.md status
- **Output**: Retrospective post for completed epics
- **Review**: Standard review process

### 5. GitHub Actions

#### Epic Completion Action
```yaml
name: Generate Epic Completion Post
on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  generate-epic-post:
    runs-on: ubuntu-latest
    if: contains(github.event.pull_request.labels.*.name, 'epic-complete')
    steps:
      - uses: actions/checkout@v4
      - name: Generate epic completion post
        uses: actions/github-script@v7
        with:
          script: |
            // Epic completion logic
            // Git history analysis
            // Planning.md integration
            // Tone template application
            // Draft file creation

#### Manual Epic Post Action
```yaml
name: Generate Manual Epic Post
on:
  workflow_dispatch:
    inputs:
      epic_number:
        description: 'Epic number to generate post for'
        required: true
        type: string

jobs:
  generate-manual-post:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Generate manual epic post
        uses: actions/github-script@v7
        with:
          script: |
            // Manual epic post generation
            // Git history analysis for specified epic
            // Planning.md status check
            // Draft file creation
```

#### Deployment Action
```yaml
name: Deploy Devlog
on:
  push:
    branches: [main]
    paths: ['devlog/**']

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - name: Build Astro site
        working-directory: devlog
        run: npm run build
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

## Content Guidelines

### Tone Requirements
- **Witty and Engaging**: Terry Pratchett-inspired humor
- **Scouting Context**: Always connect technical decisions to scout leader needs
- **Technical Accuracy**: Maintain precision while being entertaining
- **Accessible**: Explain complex concepts in relatable terms
- **Strategic Emojis**: Use 1-2 emojis per major section to make content more eye-catching (🚀 for beginnings, 🏗️ for setup, 🗄️ for data, 🔐 for security, 🧪 for testing, 🔮 for future plans, etc.)

### Content Structure
```markdown
---
title: "Epic 1 Complete — The Foundation Laid"
description: "Authentication, database setup, and the art of making computers understand scout leaders"
publishDate: 2024-01-28
tags: [devlog, epic-complete, authentication, database]
scoutingContext: "How this helps leaders manage their groups more effectively"
heroImage: ../../assets/epic1-cover.svg
---

## The Journey Begins

[Witty opening paragraph connecting scouting to the technical work]

## What We Built

[Technical summary with scouting context, including code blocks and terminal commands]

## The Human Touch

[Personal insights, challenges overcome, "aha moments"]

## What's Next

[Preview of upcoming work with scouting relevance]
```

### Visual Content Requirements
- **Cover Images**: Every post must have a custom SVG cover image generated based on the content theme
- **Code Blocks**: Include 2-3 relevant code snippets showing key technical implementations
- **Terminal Commands**: Include 1-2 terminal commands that demonstrate setup or deployment processes
- **Visual Richness**: Use code blocks and terminal output to break up text and add technical depth
- **AI Generation Note**: Every post should include a note at the end mentioning that it was generated by the AI model used, with human review and fine-tuning

### Quality Control
- **Human Review**: All automated content reviewed before publishing
- **Tone Consistency**: Templates ensure consistent voice
- **Scouting Relevance**: Every post must connect to scout leader needs
- **Technical Accuracy**: Validate technical details and explanations

## Manual Tasks

### Epic Completion Tasks
- [ ] Review automated epic completion post
- [ ] Add personal insights and scouting context
- [ ] Validate technical accuracy
- [ ] Approve for publication

### Manual Epic Review Tasks
- [ ] Review manual epic completion posts
- [ ] Enhance tone and scouting context
- [ ] Add missing technical details
- [ ] Approve for publication

### Maintenance Tasks
- [ ] Update tone templates based on feedback
- [ ] Refine PR template for better content extraction
- [ ] Monitor automation performance
- [ ] Archive old drafts and published posts

## Success Metrics

### Content Quality
- **Tone Consistency**: Maintained across all posts
- **Scouting Context**: Present in 100% of posts
- **Technical Accuracy**: No factual errors
- **Engagement**: Reader feedback and interaction

### Automation Efficiency
- **Content Generation**: 80% automated, 20% human enhancement
- **Review Time**: <30 minutes per post
- **Publication Frequency**: Epic completions only
- **System Reliability**: 95% uptime

### Audience Engagement
- **Scout Leader Interest**: Measured through comments and feedback
- **Developer Community**: Technical insights shared and discussed
- **Project Visibility**: Increased awareness of Scout Toolkit
- **Community Building**: Connection with scouting tech community

## Future Enhancements

### Phase 2: Enhanced Automation
- **Screenshot Integration**: Auto-capture app screenshots
- **Progress Visualization**: Charts and graphs from git history
- **Interactive Elements**: Code demos and live examples
- **Multi-language Support**: Portuguese and English content

### Phase 3: Community Features
- **Comment System**: Reader feedback and discussion
- **Newsletter Integration**: Email updates for subscribers
- **Social Sharing**: Automated social media posts
- **Guest Posts**: Invite other scouting tech contributors

## Getting Started

1. **Setup Astro Blog**: Initialize `/devlog` folder with Astro
2. **Configure GitHub Actions**: Set up automation workflows
3. **Create PR Template**: Add epic completion section
4. **First Manual Post**: Document Epic 1 completion (retrospective)
5. **Test Automation**: Generate first epic completion post
6. **Refine Process**: Adjust based on initial results

## Workflow Automation

### Epic Branch Management
- **Auto-create feature branch**: Triggered at first task of new epic
- **Auto-label epic-complete**: Triggered at final commit of epic
- **Branch naming convention**: `epic-{number}-{name}` (e.g., `epic-2-core-ui`)

### Git Workflow Integration
- **Epic start**: Automatic branch creation with planning.md integration
- **Epic progress**: Commit messages linked to planning.md tasks
- **Epic completion**: Automatic epic-complete label and PR creation
- **Post generation**: Triggered by epic-complete PR merge

This system will create a living document of the Scout Toolkit development journey, maintaining the perfect balance between technical insight and scouting whimsy.
