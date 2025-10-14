import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';


const blog = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/contact/blog" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  })
});

const diary = defineCollection({
  loader: glob({ pattern: "**/index.md", base: "./src/contact/blog/diary" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
  })
});

const pastPerformancesCollection = defineCollection({
  loader: glob({ 
    pattern: "**/index.md", 
    base: "./src/contact/past-performances" 
  }),
  schema: ({ image }) => z.object({
    title: z.string(),
    date: z.string().transform((str) => new Date(str)),
    playwright: z.string(),
    director: z.string(),
    excerpt: z.string(),
    image: image().optional(),
  }),
});

export const collections = { blog, diary, pastPerformancesCollection };
