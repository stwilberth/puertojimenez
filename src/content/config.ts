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
  }),
});

// Define el esquema para la colección de artistas
const artistsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    order: z.number().optional(),
    name: z.string(),
    description: z.string(),
    experience: z.string(),
    email: z.string().email().optional(),
    specialty: z.array(z.string()),
    image: z.string().optional(),
    productsImage: z.string().optional(),
  }),
});

// Exporta las colecciones
export const collections = {
  'restaurants': restaurantsCollection,
  'artists': artistsCollection,
};