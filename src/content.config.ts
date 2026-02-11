import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const performances = defineCollection({
    loader: glob({ pattern: '**/index.md', base: './contents/performances' }),
    schema: ({ image }) => z.object({
        title: z.string(),
        date: z.string().or(z.date()),
        playwright: z.string(),
        director: z.string(),
        excerpt: z.string(),
        image: image(),
    }),
});

const diary = defineCollection({
    loader: glob({ pattern: '**/index.md', base: './contents/diary' }),
    schema: z.object({
        title: z.string(),
        date: z.coerce.date(),
    }),
});

export const collections = { performances, diary };
