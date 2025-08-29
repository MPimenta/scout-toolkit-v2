import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			// Custom fields for devlog system
			tags: z.array(z.string()).optional(),
			scoutingContext: z.string().optional(),
			epicNumber: z.number().optional(),
			epicName: z.string().optional(),
			status: z.enum(['draft', 'published']).default('draft'),
		}),
});

export const collections = { blog };
