// Define el esquema para las colecciones de contenido
import { defineCollection, z } from 'astro:content';

// Define el esquema para la colección de restaurantes
const restaurantsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.string(),
    author: z.string(),
    tags: z.array(z.string()),
    layout: z.string().optional(),
  }),
});

// Exporta las colecciones
export const collections = {
  'restaurants': restaurantsCollection,
};