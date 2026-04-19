// backend/src/mocks/mock.ts
// ⚠️  DEPRECATED — SOLO REFERENCIA HISTÓRICA. NO IMPORTAR NI USAR.
// Las categorías y productos de producción se gestionan desde el admin panel.
// Importar este archivo en seed.ts o cualquier otro script causará duplicados en BD.
// Ver seed.ts — actualmente solo crea usuarios.

type MockCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  itemCount: number;
  parentSlug?: string | null;
};

type MockProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  category?: MockCategory;
  categorySlugs?: string[];
  categories?: Array<{ slug: string }>;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  sku?: string;
  features?: string[];
};

export const categories: MockCategory[] = [
  {
    id: 'cat-1',
    name: 'Todo para la cocina',
    slug: 'cocina',
    description: 'Todo para equipar tu cocina con estilo',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80',
    itemCount: 142,
  },
  {
    id: 'cat-2',
    name: 'Especial mate y café',
    slug: 'especial-mate-cafe',
    description: 'Decoración y organización para tu hogar',
    image: 'https://i.pinimg.com/736x/a1/48/e5/a148e50a9bf713aaa663b37466e14d38.jpg',
    itemCount: 98,
  },
  {
    id: 'cat-3',
    name: 'Bar y coctelería',
    slug: 'bar-cocteleria',
    description: 'Manteles, cortinas y textiles para el hogar',
    image: 'https://i.pinimg.com/1200x/20/c5/92/20c592560771b087c7b961adc0964792.jpg',
    itemCount: 54,
  },
  {
    id: 'cat-4',
    name: 'Equipá tu baño',
    slug: 'bano',
    description: 'Accesorios y textiles para el baño',
    image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&q=80',
    itemCount: 67,
  },
  {
    id: 'cat-5',
    name: 'Todo para repostería',
    slug: 'reposteria',
    description: 'Herramientas y deco para tu espacio exterior',
    image: 'https://i.pinimg.com/736x/73/13/02/731302eee2a4680f0bcb63204d41ea93.jpg',
    itemCount: 38,
  },
  {
    id: 'cat-6',
    name: 'Especial ferretería',
    slug: 'ferreteria',
    description: 'Productos y accesorios de ferretería',
    image: 'https://i.pinimg.com/736x/3e/3f/a9/3e3fa932561e25752367ca352d07b69e.jpg',
    itemCount: 45,
  },
];

export const products: MockProduct[] = [
  {
    id: 'prod-1',
    name: 'Batería de Cocina Granito 5 Piezas',
    slug: 'bateria-cocina-granito-5pz',
    description: 'Set completo de batería de cocina con revestimiento de granito antiadherente. Incluye cacerolas y sartenes.',
    shortDescription: 'Set premium de 5 piezas con revestimiento antiadherente.',
    price: 89990,
    originalPrice: 109990,
    discount: 18,
    images: [
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
      'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&q=80',
    ],
    category: categories[0],
    tags: ['destacado', 'oferta', 'cocina'],
    rating: 4.8,
    reviewCount: 124,
    inStock: true,
    sku: 'AM-8952',
    features: [
      'Revestimiento antiadherente triple capa',
      'Mangos de silicona fría',
      'Apta para todas las hornallas',
      'Base reforzada de aluminio',
    ],
  },
  {
    id: 'prod-2',
    name: 'Molinillo de Café Premium',
    slug: 'molinillo-cafe-premium',
    description: 'Molinillo manual de café con cuerpo de vidrio y mecanismo de cerámica ajustable.',
    shortDescription: 'Molinillo manual con mecanismo cerámico ajustable.',
    price: 24990,
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=800&q=80',
    ],
    category: categories[0],
    tags: ['nuevo', 'cocina', 'café'],
    rating: 4.6,
    reviewCount: 89,
    inStock: true,
    sku: 'AM-8431',
    features: [],
  },
  {
    id: 'prod-3',
    name: 'Set Cuchillos Design con Soporte',
    slug: 'set-cuchillos-design-soporte',
    description: 'Set de 4 cuchillos de acero inoxidable con soporte de madera.',
    shortDescription: 'Set x4 cuchillos de acero inoxidable con soporte.',
    price: 34990,
    originalPrice: 42990,
    discount: 19,
    images: [
      'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&q=80',
      'https://images.unsplash.com/photo-1566454419290-57a64afe1e04?w=800&q=80',
    ],
    category: categories[0],
    tags: ['oferta', 'cocina', 'destacado'],
    rating: 4.7,
    reviewCount: 56,
    inStock: true,
    sku: 'AM-1864',
    features: [],
  },
  {
    id: 'prod-4',
    name: 'Organizador Bambú con Asas',
    slug: 'organizador-bambu-asas',
    description: 'Organizador multiuso de bambú natural con asas laterales.',
    shortDescription: 'Organizador de bambú natural con asas ergonómicas.',
    price: 18990,
    originalPrice: 22990,
    discount: 17,
    images: [
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80',
    ],
    category: categories[1],
    tags: ['oferta', 'hogar', 'sustentable'],
    rating: 4.5,
    reviewCount: 43,
    inStock: true,
    sku: 'AM-3563',
    features: [],
  },
  {
    id: 'prod-5',
    name: 'Copa Brunello Vino 390ml',
    slug: 'copa-brunello-vino-390ml',
    description: 'Copa de cristal para vino tinto, 390ml.',
    shortDescription: 'Copa de cristal clásica para vino tinto, 390ml.',
    price: 4990,
    images: [
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
    ],
    category: categories[0],
    tags: ['cocina', 'vidrio'],
    rating: 4.4,
    reviewCount: 78,
    inStock: true,
    sku: 'AM-7051',
    features: [],
  },
];