import { prisma } from './config/prisma';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import {
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  UserRole,
} from './types/enums';

dotenv.config();

type PrismaOrderStatusInput = Parameters<typeof prisma.orderStatusHistory.create>[0]['data']['status'];
type PrismaPaymentStatusInput = Parameters<typeof prisma.order.create>[0]['data']['paymentStatus'];

type PersistedProduct = {
  id: string;
  name: string;
  price: number;
  images: string[];
};

interface DemoProductTemplate {
  name: string;
  price: number;
  originalPrice?: number;
  tags: string[];
}

interface DemoSubcategory {
  name: string;
  slug: string;
  description: string;
  imageSet: ImageSetKey;
  featurePool: FeaturePoolKey;
  products: DemoProductTemplate[];
}

interface DemoCategory {
  name: string;
  slug: string;
  description: string;
  imageSet: ImageSetKey;
  subcategories: DemoSubcategory[];
}

interface GeneratedProduct {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  categorySlug: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stock: number;
  sku: string;
  features: string[];
}

interface DemoCustomer {
  firstName: string;
  lastName: string;
  email: string;
}

const UNSPLASH_PARAMS = 'auto=format&fit=crop&w=600&h=600&q=80';
const unsplash = (photoId: string): string => `https://images.unsplash.com/${photoId}?${UNSPLASH_PARAMS}`;

const IMAGE_SETS = {
  cocina: [
    unsplash('photo-1587300003388-59208cc962cb'),
    unsplash('photo-1590794056226-79ef3a8147e1'),
    unsplash('photo-1593618998160-e34014e67546'),
    unsplash('photo-1416339306562-f3d12fefd36f'),
  ],
  cafeMate: [
    unsplash('photo-1495474472287-4d71bcdd2085'),
    unsplash('photo-1454625233598-f29d597eea1e'),
    unsplash('photo-1495978866932-92dbc079e62e'),
    unsplash('photo-1593618998160-e34014e67546'),
  ],
  cocteleria: [
    unsplash('photo-1510812431401-41d2bd2722f3'),
    unsplash('photo-1479030574009-1e48577746e8'),
    unsplash('photo-1495474472287-4d71bcdd2085'),
    unsplash('photo-1454625233598-f29d597eea1e'),
  ],
  bano: [
    unsplash('photo-1620626011761-996317b8d101'),
    unsplash('photo-1556228578-8c89e6adf883'),
    unsplash('photo-1552321554-5fefe8c9ef14'),
    unsplash('photo-1449182325215-d517de72c42d'),
  ],
  reposteria: [
    unsplash('photo-1578985545062-69928b1d9587'),
    unsplash('photo-1587300003388-59208cc962cb'),
    unsplash('photo-1593618998160-e34014e67546'),
    unsplash('photo-1556228578-8c89e6adf883'),
  ],
  ferreteria: [
    unsplash('photo-1530124566582-a618bc2615dc'),
    unsplash('photo-1540538581514-1d465aaad58c'),
    unsplash('photo-1595428774223-ef52624120d2'),
    unsplash('photo-1610701596007-11502861dcfa'),
  ],
  hogar: [
    unsplash('photo-1595428774223-ef52624120d2'),
    unsplash('photo-1610701596007-11502861dcfa'),
    unsplash('photo-1449182325215-d517de72c42d'),
    unsplash('photo-1566073771259-6a8506099945'),
  ],
  textiles: [
    unsplash('photo-1566073771259-6a8506099945'),
    unsplash('photo-1556228578-8c89e6adf883'),
    unsplash('photo-1449182325215-d517de72c42d'),
    unsplash('photo-1595428774223-ef52624120d2'),
  ],
  iluminacion: [
    unsplash('photo-1507473885765-e6ed057f782c'),
    unsplash('photo-1510812431401-41d2bd2722f3'),
    unsplash('photo-1484101403633-562f891dc89a'),
    unsplash('photo-1449182325215-d517de72c42d'),
  ],
  jardineria: [
    unsplash('photo-1545243424-0ce743321e11'),
    unsplash('photo-1464207687429-7505649dae38'),
    unsplash('photo-1574943320219-553eb213f72d'),
    unsplash('photo-1482938289607-e9573fc25ebb'),
  ],
} as const;

type ImageSetKey = keyof typeof IMAGE_SETS;

const FEATURE_POOLS = {
  cocina: [
    'Material de alta resistencia para uso diario',
    'Facil limpieza y mantenimiento rapido',
    'Diseno ergonomico para mejor agarre',
    'Terminacion premium con excelente durabilidad',
    'Compatible con cocinas modernas',
    'Presentacion ideal para regalo',
  ],
  cafeMate: [
    'Conserva temperatura y sabor por mas tiempo',
    'Componentes resistentes al uso intensivo',
    'Diseno pensado para rituales diarios',
    'Acabado elegante para mesa o escritorio',
    'Fuerte relacion precio-calidad',
    'Facil de transportar y guardar',
  ],
  cocteleria: [
    'Acero y vidrio de alta calidad',
    'Formato ideal para reuniones y eventos',
    'Apto para uso domestico y profesional',
    'Terminaciones pulidas y modernas',
    'Facil lavado despues de cada uso',
    'Aporta estilo al bar de hogar',
  ],
  bano: [
    'Texturas suaves y acabados prolijos',
    'Resistente a humedad y uso diario',
    'Diseno minimalista para banos modernos',
    'Instalacion o guardado sin complicaciones',
    'Mejora la organizacion del espacio',
    'Materiales faciles de mantener',
  ],
  reposteria: [
    'Superficie antiadherente para mejor desmolde',
    'Medidas practicas para preparaciones caseras',
    'Ideal para principiantes y avanzados',
    'Resiste altas temperaturas de horneado',
    'Componentes aptos para contacto alimentario',
    'Limpieza simple luego del uso',
  ],
  ferreteria: [
    'Construccion robusta para tareas de hogar',
    'Agarre firme y seguro en cada uso',
    'Incluye piezas clave para mantenimiento',
    'Rendimiento confiable en trabajos frecuentes',
    'Diseno compacto para guardar facilmente',
    'Excelente opcion para equipamiento inicial',
  ],
  hogar: [
    'Ahorra espacio en ambientes reducidos',
    'Diseño funcional para orden diario',
    'Material resistente para uso continuo',
    'Formato versatil para multiples ambientes',
    'Combinable con distintos estilos de decoracion',
    'Armado simple y rapido',
  ],
  textiles: [
    'Tejido suave y agradable al tacto',
    'Colores neutros faciles de combinar',
    'Confeccion reforzada para mayor vida util',
    'Ideal para renovar ambientes rapidamente',
    'Lavado practico sin complicaciones',
    'Excelente caida y terminacion',
  ],
  iluminacion: [
    'Bajo consumo y buena potencia luminica',
    'Diseño contemporaneo y elegante',
    'Instalacion simple en pocos pasos',
    'Luz confortable para uso cotidiano',
    'Materiales seguros y durables',
    'Ideal para crear atmosfera calida',
  ],
  jardineria: [
    'Resistente a exterior y cambios climaticos',
    'Formato practico para mantenimiento diario',
    'Diseno funcional para patios y balcones',
    'Materiales livianos de buena duracion',
    'Ayuda a mejorar el cuidado de plantas',
    'Uso comodo en espacios chicos o grandes',
  ],
} as const;

type FeaturePoolKey = keyof typeof FEATURE_POOLS;

const p = (
  name: string,
  price: number,
  tags: string[],
  originalPrice?: number
): DemoProductTemplate => ({ name, price, tags, originalPrice });

const sub = (
  name: string,
  slug: string,
  description: string,
  imageSet: ImageSetKey,
  featurePool: FeaturePoolKey,
  products: DemoProductTemplate[]
): DemoSubcategory => ({
  name,
  slug,
  description,
  imageSet,
  featurePool,
  products,
});

const category = (
  name: string,
  slug: string,
  description: string,
  imageSet: ImageSetKey,
  subcategories: DemoSubcategory[]
): DemoCategory => ({
  name,
  slug,
  description,
  imageSet,
  subcategories,
});

const DEMO_CATEGORIES: DemoCategory[] = [
  category('Cocina', 'cocina', 'Equipamiento funcional para cocinar todos los dias', 'cocina', [
    sub(
      'Baterias de Cocina',
      'baterias-cocina',
      'ollas y sartenes para preparaciones de todos los dias',
      'cocina',
      'cocina',
      [
        p('Set de Ollas Granito 7 Piezas', 129990, ['oferta', 'bestseller', 'cocina'], 159990),
        p('Sarten Profunda Antiadherente 28cm', 46990, ['nuevo', 'cocina', 'hogar'], 57990),
      ]
    ),
    sub(
      'Utensilios y Accesorios',
      'utensilios-accesorios',
      'accesorios practicos para preparacion y servicio',
      'cocina',
      'cocina',
      [
        p('Set Cuchillos Chef Acero 5 Piezas', 38990, ['oferta', 'cocina', 'premium'], 47990),
        p('Juego Espatulas Silicona Premium x6', 15990, ['nuevo', 'cocina', 'organizacion']),
      ]
    ),
    sub(
      'Almacenaje de Cocina',
      'almacenaje-cocina',
      'frascos y organizadores para mantener ordenada la alacena',
      'cocina',
      'hogar',
      [
        p('Frascos Hermeticos Vidrio x6 con Etiquetas', 26990, ['bestseller', 'organizacion', 'hogar'], 31990),
        p('Organizador Deslizante Bajo Mesada', 34990, ['nuevo', 'hogar', 'cocina']),
      ]
    ),
  ]),
  category('Cafe y Mate', 'cafe-mate', 'Accesorios para disfrutar infusiones con estilo', 'cafeMate', [
    sub(
      'Molinillos y Cafeteras',
      'molinillos-cafeteras',
      'equipos para cafe de especialidad en casa',
      'cafeMate',
      'cafeMate',
      [
        p('Cafetera Italiana Acero 6 Tazas', 34990, ['oferta', 'cafe', 'bestseller'], 41990),
        p('Prensa Francesa Doble Filtro 1L', 42990, ['nuevo', 'cafe', 'premium']),
      ]
    ),
    sub(
      'Mates y Bombillas',
      'mates-bombillas',
      'mate tradicional y accesorios para uso diario',
      'cafeMate',
      'cafeMate',
      [
        p('Mate Imperial Acero Inox Grabado', 29990, ['oferta', 'mate', 'premium'], 37990),
        p('Bombilla Pico Loro Alpaca Premium', 18990, ['nuevo', 'mate', 'bestseller']),
      ]
    ),
    sub(
      'Termos y Accesorios',
      'termos-accesorios',
      'termos y bolsos para llevar tus infusiones',
      'cafeMate',
      'cafeMate',
      [
        p('Termo Acero 1L Pico Cebador', 52990, ['oferta', 'mate', 'hogar'], 64990),
        p('Matera Ecocuero Organizadora', 25990, ['nuevo', 'organizacion', 'mate']),
      ]
    ),
  ]),
  category('Bebidas y Cocteleria', 'cocteleria', 'Cristaleria y herramientas para tragos y reuniones', 'cocteleria', [
    sub(
      'Copas y Vasos',
      'copas-vasos',
      'cristaleria para mesa diaria y ocasiones especiales',
      'cocteleria',
      'cocteleria',
      [
        p('Set Copas Vino Cristal x6', 32990, ['oferta', 'bestseller', 'mesa'], 39990),
        p('Vasos Trago Largo 420ml x6', 21990, ['nuevo', 'cocteleria', 'hogar']),
      ]
    ),
    sub(
      'Accesorios Cocteleria',
      'accesorios-cocteleria',
      'herramientas para preparar tragos en casa',
      'cocteleria',
      'cocteleria',
      [
        p('Kit Bartender 12 Piezas con Base', 59990, ['oferta', 'premium', 'bar'], 74990),
        p('Shaker Boston Profesional 750ml', 27990, ['nuevo', 'bar', 'cocteleria']),
      ]
    ),
    sub(
      'Bar de Hogar',
      'bar-hogar',
      'accesorios de apoyo para barra y servicio',
      'cocteleria',
      'cocteleria',
      [
        p('Cubitera Acero Doble Pared', 24990, ['bestseller', 'bar', 'hogar']),
        p('Set Posavasos Marmol x4', 13990, ['nuevo', 'decoracion', 'mesa']),
      ]
    ),
  ]),
  category('Bano', 'bano', 'Textiles y accesorios para confort diario', 'bano', [
    sub(
      'Toallas y Textiles',
      'toallas-textiles',
      'toallas y piezas textiles para un bano confortable',
      'bano',
      'bano',
      [
        p('Juego Toallas Algodon Peinado x3', 28990, ['oferta', 'bestseller', 'bano'], 34990),
        p('Alfombra de Bano Antideslizante', 16990, ['nuevo', 'hogar', 'bano']),
      ]
    ),
    sub(
      'Accesorios Bano',
      'accesorios-bano',
      'dispenser y sets funcionales para mesada',
      'bano',
      'bano',
      [
        p('Dispenser Jabon Ceramica Mate', 14990, ['nuevo', 'bano', 'decoracion']),
        p('Set Accesorios Bano 4 Piezas Bamboo', 29990, ['oferta', 'bano', 'premium'], 35990),
      ]
    ),
    sub(
      'Organizacion de Ducha',
      'organizacion-ducha',
      'canastos y estantes para ordenar shampoo y cuidado personal',
      'bano',
      'bano',
      [
        p('Estante Esquinero Ducha Inoxidable', 23990, ['bestseller', 'organizacion', 'bano']),
        p('Canasto Ducha Colgante Doble', 18990, ['nuevo', 'organizacion', 'hogar']),
      ]
    ),
  ]),
  category('Reposteria', 'reposteria', 'Herramientas para hornear y decorar en casa', 'reposteria', [
    sub(
      'Moldes y Bandejas',
      'moldes-bandejas',
      'moldes para bizcochos, muffins y tartas',
      'reposteria',
      'reposteria',
      [
        p('Moldes Siliconados Reposteria x8', 22990, ['oferta', 'bestseller', 'reposteria']),
        p('Bandeja Antiadherente Premium 40cm', 18990, ['nuevo', 'horno', 'cocina']),
      ]
    ),
    sub(
      'Decoracion y Pastillaje',
      'decoracion-pastillaje',
      'boquillas y accesorios para terminaciones prolijas',
      'reposteria',
      'reposteria',
      [
        p('Set Boquillas Acero Pasteleria x24', 20990, ['oferta', 'reposteria', 'premium'], 25990),
        p('Base Giratoria Decoracion Torta', 27990, ['nuevo', 'bestseller', 'reposteria']),
      ]
    ),
    sub(
      'Utensilios de Medicion',
      'utensilios-medicion',
      'balanzas y medidores para recetas exactas',
      'reposteria',
      'reposteria',
      [
        p('Balanza Digital Cocina 10kg', 25990, ['bestseller', 'cocina', 'precision']),
        p('Juego Tazas y Cucharas Medidoras Inox', 14990, ['nuevo', 'cocina', 'organizacion']),
      ]
    ),
  ]),
  category('Ferreteria', 'ferreteria', 'Herramientas y soluciones de mantenimiento', 'ferreteria', [
    sub(
      'Herramientas Manuales',
      'herramientas-manuales',
      'kits para reparaciones frecuentes en el hogar',
      'ferreteria',
      'ferreteria',
      [
        p('Caja Herramientas Hogar 45 Piezas', 54990, ['oferta', 'bestseller', 'ferreteria'], 66990),
        p('Taladro Percutor 650W con Maletin', 89990, ['oferta', 'premium', 'ferreteria'], 109990),
      ]
    ),
    sub(
      'Pinturas y Acabados',
      'pinturas-acabados',
      'insumos para pintura interior y retoques',
      'ferreteria',
      'ferreteria',
      [
        p('Pintura Interior Lavable 4L', 24990, ['nuevo', 'hogar', 'reparacion']),
        p('Rodillo Profesional + Bandeja Completa', 15990, ['bestseller', 'reparacion', 'ferreteria']),
      ]
    ),
    sub(
      'Organizacion de Taller',
      'organizacion-taller',
      'paneles y cajas para ordenar piezas y tornillos',
      'ferreteria',
      'ferreteria',
      [
        p('Panel Perforado Taller con Ganchos', 41990, ['nuevo', 'organizacion', 'taller']),
        p('Caja Tornilleria 24 Compartimentos', 17990, ['bestseller', 'organizacion', 'ferreteria']),
      ]
    ),
  ]),
  category('Hogar y Organizacion', 'hogar-organizacion', 'Orden y decoracion para todos los ambientes', 'hogar', [
    sub(
      'Organizadores',
      'organizadores',
      'canastos y modulos para simplificar el orden diario',
      'hogar',
      'hogar',
      [
        p('Canasto Plegable Tela Reforzada x2', 19990, ['bestseller', 'organizacion', 'hogar']),
        p('Organizador Modular Apilable x3', 28990, ['nuevo', 'hogar', 'almacenaje']),
      ]
    ),
    sub(
      'Decoracion',
      'decoracion',
      'objetos decorativos para living y dormitorios',
      'hogar',
      'hogar',
      [
        p('Jarron Ceramica Texturada 30cm', 25990, ['nuevo', 'decoracion', 'hogar']),
        p('Cuadro Triptico Minimalista 90x45', 49990, ['oferta', 'premium', 'decoracion'], 59990),
      ]
    ),
    sub(
      'Lavanderia y Limpieza',
      'lavanderia-limpieza',
      'soluciones para ropa y limpieza diaria',
      'hogar',
      'hogar',
      [
        p('Cesto Ropa Doble Compartimento', 32990, ['bestseller', 'organizacion', 'hogar']),
        p('Organizador Limpieza con Ruedas', 26990, ['nuevo', 'hogar', 'practico']),
      ]
    ),
  ]),
  category('Textiles', 'textiles', 'Textiles para vestir mesa, dormitorio y living', 'textiles', [
    sub(
      'Manteles y Servilletas',
      'manteles-servilletas',
      'opciones para mesa diaria y eventos',
      'textiles',
      'textiles',
      [
        p('Mantel Antimanchas 160x240', 27990, ['oferta', 'mesa', 'textiles'], 33990),
        p('Set Servilletas Lino x6', 16990, ['nuevo', 'mesa', 'hogar']),
      ]
    ),
    sub(
      'Cortinas y Aislantes',
      'cortinas-aislantes',
      'cortinas para regular luz y mejorar privacidad',
      'textiles',
      'textiles',
      [
        p('Cortina Blackout Texturada 140x220', 38990, ['bestseller', 'textiles', 'hogar']),
        p('Cortina Voile Doble Capa 2 Piezas', 29990, ['nuevo', 'decoracion', 'textiles']),
      ]
    ),
    sub(
      'Almohadones y Mantas',
      'almohadones-mantas',
      'textiles para sumar calidez y confort',
      'textiles',
      'textiles',
      [
        p('Set Almohadones Chenille x2', 24990, ['nuevo', 'decoracion', 'textiles']),
        p('Manta Tejida Sofa 130x170', 31990, ['oferta', 'hogar', 'bestseller'], 38990),
      ]
    ),
  ]),
  category('Iluminacion', 'iluminacion', 'Luz funcional y decorativa para interior y exterior', 'iluminacion', [
    sub(
      'Lamparas de Mesa',
      'lamparas-mesa',
      'lamparas para escritorio, living y dormitorio',
      'iluminacion',
      'iluminacion',
      [
        p('Lampara LED Regulable USB-C', 34990, ['oferta', 'iluminacion', 'bestseller'], 41990),
        p('Velador Metal y Madera E27', 28990, ['nuevo', 'decoracion', 'hogar']),
      ]
    ),
    sub(
      'Luces LED',
      'luces-led',
      'tiras y packs led para ambientacion moderna',
      'iluminacion',
      'iluminacion',
      [
        p('Tira LED RGB 10m App + Control', 45990, ['oferta', 'iluminacion', 'tecnologia'], 55990),
        p('Pack Luces Calidas Guirnalda 20m', 22990, ['nuevo', 'hogar', 'ambientacion']),
      ]
    ),
    sub(
      'Iluminacion Exterior',
      'iluminacion-exterior',
      'opciones para balcon, patio y jardin',
      'iluminacion',
      'iluminacion',
      [
        p('Baliza Solar Jardin x4', 36990, ['bestseller', 'exterior', 'iluminacion']),
        p('Aplique Exterior LED IP65', 27990, ['nuevo', 'hogar', 'exterior']),
      ]
    ),
  ]),
  category('Jardineria', 'jardineria', 'Productos para cuidado de plantas y espacios verdes', 'jardineria', [
    sub(
      'Macetas y Jardineras',
      'macetas-jardineras',
      'macetas para interior, balcon y terraza',
      'jardineria',
      'jardineria',
      [
        p('Maceta Ceramica Drenante 28cm', 18990, ['nuevo', 'jardin', 'decoracion']),
        p('Jardinera Autorriego 60cm', 32990, ['oferta', 'bestseller', 'jardin'], 39990),
      ]
    ),
    sub(
      'Accesorios Jardin',
      'accesorios-jardin',
      'kits practicos para poda y mantenimiento',
      'jardineria',
      'jardineria',
      [
        p('Set Herramientas Jardin 9 Piezas', 29990, ['bestseller', 'jardin', 'hogar']),
        p('Guantes Jardin + Rociador Presion', 15990, ['nuevo', 'jardin', 'practico']),
      ]
    ),
    sub(
      'Riego y Cuidado',
      'riego-cuidado',
      'sistemas para mantener humedad y riego constante',
      'jardineria',
      'jardineria',
      [
        p('Kit Riego por Goteo 20 Macetas', 35990, ['oferta', 'jardin', 'bestseller'], 42990),
        p('Manguera Expandible 15m con Pistola', 24990, ['nuevo', 'jardin', 'hogar']),
      ]
    ),
  ]),
];

const DEMO_CUSTOMERS: DemoCustomer[] = [
  { firstName: 'Lucia', lastName: 'Benitez', email: 'cliente.demo.01@allmart.test' },
  { firstName: 'Martin', lastName: 'Sosa', email: 'cliente.demo.02@allmart.test' },
  { firstName: 'Florencia', lastName: 'Quiroga', email: 'cliente.demo.03@allmart.test' },
  { firstName: 'Diego', lastName: 'Molina', email: 'cliente.demo.04@allmart.test' },
  { firstName: 'Carolina', lastName: 'Ramos', email: 'cliente.demo.05@allmart.test' },
  { firstName: 'Nicolas', lastName: 'Aguirre', email: 'cliente.demo.06@allmart.test' },
  { firstName: 'Paula', lastName: 'Vega', email: 'cliente.demo.07@allmart.test' },
  { firstName: 'Joaquin', lastName: 'Ibarra', email: 'cliente.demo.08@allmart.test' },
  { firstName: 'Milagros', lastName: 'Farias', email: 'cliente.demo.09@allmart.test' },
  { firstName: 'Agustin', lastName: 'Castro', email: 'cliente.demo.10@allmart.test' },
  { firstName: 'Rocio', lastName: 'Pereyra', email: 'cliente.demo.11@allmart.test' },
  { firstName: 'Franco', lastName: 'Mendez', email: 'cliente.demo.12@allmart.test' },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function calculateDiscount(price: number, originalPrice?: number): number | undefined {
  if (!originalPrice || originalPrice <= price) return undefined;
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
  return discount > 0 ? discount : undefined;
}

function getImages(imageSet: ImageSetKey, seed: number): string[] {
  const set = IMAGE_SETS[imageSet];
  return [0, 1, 2].map((offset) => set[(seed + offset) % set.length]);
}

function pickFeatures(pool: readonly string[], seed: number, amount = 4): string[] {
  const selected: string[] = [];
  for (let i = 0; i < amount; i += 1) {
    selected.push(pool[(seed + i) % pool.length]);
  }
  return Array.from(new Set(selected));
}

function toPrismaOrderStatus(status: OrderStatus | undefined): PrismaOrderStatusInput {
  if (status === undefined) {
    return 'pendiente' as PrismaOrderStatusInput;
  }

  const map: Record<OrderStatus, PrismaOrderStatusInput> = {
    [OrderStatus.PENDING]: 'pendiente' as PrismaOrderStatusInput,
    [OrderStatus.CONFIRMED]: 'confirmado' as PrismaOrderStatusInput,
    [OrderStatus.PROCESSING]: 'en_preparacion' as PrismaOrderStatusInput,
    [OrderStatus.SHIPPED]: 'enviado' as PrismaOrderStatusInput,
    [OrderStatus.DELIVERED]: 'entregado' as PrismaOrderStatusInput,
    [OrderStatus.CANCELLED]: 'cancelado' as PrismaOrderStatusInput,
  };
  return map[status];
}

function toPrismaPaymentStatus(status: PaymentStatus): PrismaPaymentStatusInput {
  const map: Record<PaymentStatus, PrismaPaymentStatusInput> = {
    [PaymentStatus.UNPAID]: 'no_abonado' as PrismaPaymentStatusInput,
    [PaymentStatus.PAID]: 'abonado' as PrismaPaymentStatusInput,
  };
  return map[status];
}

function buildStatusHistory(finalStatus: OrderStatus): OrderStatus[] {
  if (finalStatus === OrderStatus.PENDING) return [OrderStatus.PENDING];
  if (finalStatus === OrderStatus.CONFIRMED) return [OrderStatus.PENDING, OrderStatus.CONFIRMED];
  if (finalStatus === OrderStatus.PROCESSING) {
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING];
  }
  if (finalStatus === OrderStatus.SHIPPED) {
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED];
  }
  if (finalStatus === OrderStatus.DELIVERED) {
    return [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];
  }
  return [OrderStatus.PENDING, OrderStatus.CANCELLED];
}

function makeRecentDate(daysAgo: number, hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, (daysAgo * 7) % 60, 0, 0);
  return date;
}

function buildDemoProducts(categories: DemoCategory[]): GeneratedProduct[] {
  const products: GeneratedProduct[] = [];
  let globalIndex = 1;

  for (const categoryRow of categories) {
    for (const subcategoryRow of categoryRow.subcategories) {
      for (const template of subcategoryRow.products) {
        const slug = slugify(template.name);
        const discount = calculateDiscount(template.price, template.originalPrice);
        const rating = Number((4 + ((globalIndex % 11) / 10)).toFixed(1));
        const reviewCount = 10 + ((globalIndex * 17) % 191);
        const stock = 10 + ((globalIndex * 13) % 91);
        const features = pickFeatures(FEATURE_POOLS[subcategoryRow.featurePool], globalIndex);
        const skuCode = subcategoryRow.slug
          .split('-')
          .map((chunk) => chunk[0])
          .join('')
          .toUpperCase()
          .slice(0, 5);
        const sku = `ALM-${skuCode}-${String(globalIndex).padStart(4, '0')}`;

        products.push({
          name: template.name,
          slug,
          shortDescription: `${template.name} pensado para ${subcategoryRow.name.toLowerCase()} con estilo y practicidad.`,
          description:
            `${template.name} combina materiales durables y detalles cuidados para uso diario. ` +
            `Ideal para ${subcategoryRow.description.toLowerCase()}. ` +
            'Su relacion precio-calidad esta orientada a hogares argentinos que buscan funcionalidad y diseno.',
          price: template.price,
          originalPrice: template.originalPrice,
          discount,
          images: getImages(subcategoryRow.imageSet, globalIndex),
          categorySlug: subcategoryRow.slug,
          tags: Array.from(new Set(template.tags)),
          rating,
          reviewCount,
          inStock: stock > 0,
          stock,
          sku,
          features,
        });

        globalIndex += 1;
      }
    }
  }

  return products;
}

function validateCatalog(categories: DemoCategory[], products: GeneratedProduct[]): void {
  if (products.length < 60 || products.length > 80) {
    throw new Error(`El catalogo debe tener entre 60 y 80 productos. Total actual: ${products.length}`);
  }

  const bySubcategory = new Map<string, number>();
  for (const product of products) {
    bySubcategory.set(product.categorySlug, (bySubcategory.get(product.categorySlug) ?? 0) + 1);

    if (product.images.length < 3) {
      throw new Error(`El producto ${product.slug} tiene menos de 3 imagenes`);
    }

    if (product.rating < 4 || product.rating > 5) {
      throw new Error(`El producto ${product.slug} tiene rating fuera de rango`);
    }

    if (product.reviewCount < 10 || product.reviewCount > 200) {
      throw new Error(`El producto ${product.slug} tiene reviewCount fuera de rango`);
    }

    if (product.stock < 10 || product.stock > 100) {
      throw new Error(`El producto ${product.slug} tiene stock fuera de rango`);
    }
  }

  for (const categoryRow of categories) {
    if (categoryRow.subcategories.length < 2 || categoryRow.subcategories.length > 4) {
      throw new Error(`La categoria ${categoryRow.slug} no cumple 2-4 subcategorias`);
    }

    for (const subcategoryRow of categoryRow.subcategories) {
      const count = bySubcategory.get(subcategoryRow.slug) ?? 0;
      if (count === 0) {
        throw new Error(`La subcategoria ${subcategoryRow.slug} no tiene productos`);
      }
    }
  }
}

async function seedUsers(): Promise<number> {
  console.log('Creando/actualizando usuarios...');

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const editorPassword = process.env.SEED_EDITOR_PASSWORD || 'editor123';
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD || 'cliente123';

  const hashedAdmin = await bcrypt.hash(adminPassword, 10);
  const hashedEditor = await bcrypt.hash(editorPassword, 10);
  const hashedCustomer = await bcrypt.hash(customerPassword, 10);

  await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {
      passwordHash: hashedAdmin,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      firstName: 'Admin',
      lastName: 'Principal',
      email: 'admin@admin.com',
      passwordHash: hashedAdmin,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'editor@admin.com' },
    update: {
      passwordHash: hashedEditor,
      role: UserRole.EDITOR,
      isActive: true,
    },
    create: {
      firstName: 'Editor',
      lastName: 'Principal',
      email: 'editor@admin.com',
      passwordHash: hashedEditor,
      role: UserRole.EDITOR,
      isActive: true,
    },
  });

  for (const customer of DEMO_CUSTOMERS) {
    await prisma.user.upsert({
      where: { email: customer.email },
      update: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        passwordHash: hashedCustomer,
        role: UserRole.CUSTOMER,
        isActive: true,
      },
      create: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        passwordHash: hashedCustomer,
        role: UserRole.CUSTOMER,
        isActive: true,
      },
    });
  }

  const totalUsers = 2 + DEMO_CUSTOMERS.length;
  console.log(`Usuarios listos: ${totalUsers}`);

  return totalUsers;
}

async function seedCategoriesAndProducts(products: GeneratedProduct[]): Promise<{
  categoryCount: number;
  subcategoryCount: number;
  productCount: number;
  persistedProducts: PersistedProduct[];
}> {
  console.log('Creando categorias y subcategorias...');

  const categoryIdBySlug = new Map<string, string>();
  let categoryCount = 0;
  let subcategoryCount = 0;

  for (let categoryIndex = 0; categoryIndex < DEMO_CATEGORIES.length; categoryIndex += 1) {
    const categoryRow = DEMO_CATEGORIES[categoryIndex];
    const categoryImage = getImages(categoryRow.imageSet, categoryIndex)[0];

    const parent = await prisma.category.upsert({
      where: { slug: categoryRow.slug },
      update: {
        name: categoryRow.name,
        description: categoryRow.description,
        imageUrl: categoryImage,
        parentId: null,
        isVisible: true,
      },
      create: {
        name: categoryRow.name,
        slug: categoryRow.slug,
        description: categoryRow.description,
        imageUrl: categoryImage,
        parentId: null,
        itemCount: 0,
        isVisible: true,
      },
    });

    categoryIdBySlug.set(categoryRow.slug, parent.id);
    categoryCount += 1;

    for (let subIndex = 0; subIndex < categoryRow.subcategories.length; subIndex += 1) {
      const subcategoryRow = categoryRow.subcategories[subIndex];
      const subcategoryImage = getImages(subcategoryRow.imageSet, subIndex + categoryIndex)[0];

      const child = await prisma.category.upsert({
        where: { slug: subcategoryRow.slug },
        update: {
          name: subcategoryRow.name,
          description: subcategoryRow.description,
          imageUrl: subcategoryImage,
          parentId: parent.id,
          isVisible: true,
        },
        create: {
          name: subcategoryRow.name,
          slug: subcategoryRow.slug,
          description: subcategoryRow.description,
          imageUrl: subcategoryImage,
          parentId: parent.id,
          itemCount: 0,
          isVisible: true,
        },
      });

      categoryIdBySlug.set(subcategoryRow.slug, child.id);
      subcategoryCount += 1;
    }
  }

  console.log(`Categorias: ${categoryCount}, subcategorias: ${subcategoryCount}`);
  console.log('Creando/actualizando productos...');

  let productCount = 0;
  const persistedProducts: PersistedProduct[] = [];

  for (const product of products) {
    const categoryId = categoryIdBySlug.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`No se encontro categoryId para slug ${product.categorySlug}`);
    }

    const existingBySlug = await prisma.product.findUnique({
      where: { slug: product.slug },
      select: { id: true },
    });

    const existingBySku = await prisma.product.findUnique({
      where: { sku: product.sku },
      select: { id: true },
    });

    const existingId = existingBySlug?.id || existingBySku?.id;

    const productRow = existingId
      ? await prisma.product.update({
          where: { id: existingId },
          data: {
            name: product.name,
            slug: product.slug,
            shortDescription: product.shortDescription,
            description: product.description,
            price: product.price,
            originalPrice: product.originalPrice ?? null,
            discount: product.discount ?? null,
            images: product.images,
            categoryId,
            tags: product.tags,
            rating: product.rating,
            reviewCount: product.reviewCount,
            inStock: product.inStock,
            stock: product.stock,
            sku: product.sku,
            features: product.features,
            status: ProductStatus.ACTIVE,
            isFeatured: product.tags.includes('bestseller'),
          },
        })
      : await prisma.product.create({
          data: {
            name: product.name,
            slug: product.slug,
            shortDescription: product.shortDescription,
            description: product.description,
            price: product.price,
            originalPrice: product.originalPrice ?? null,
            discount: product.discount ?? null,
            images: product.images,
            categoryId,
            tags: product.tags,
            rating: product.rating,
            reviewCount: product.reviewCount,
            inStock: product.inStock,
            stock: product.stock,
            sku: product.sku,
            features: product.features,
            status: ProductStatus.ACTIVE,
            isFeatured: product.tags.includes('bestseller'),
          },
        });

    await prisma.productCategory.upsert({
      where: {
        productId_categoryId: {
          productId: productRow.id,
          categoryId,
        },
      },
      update: {},
      create: {
        productId: productRow.id,
        categoryId,
      },
    });

    const images = Array.isArray(productRow.images)
      ? (productRow.images as string[])
      : [];

    persistedProducts.push({
      id: productRow.id,
      name: productRow.name,
      price: Number(productRow.price),
      images,
    });

    productCount += 1;
  }

  const subcategoryIds = DEMO_CATEGORIES
    .flatMap((categoryRow) => categoryRow.subcategories.map((subcategoryRow) => categoryIdBySlug.get(subcategoryRow.slug)))
    .filter((id): id is string => Boolean(id));

  const grouped = await prisma.productCategory.groupBy({
    by: ['categoryId'],
    where: {
      categoryId: { in: subcategoryIds },
      product: { status: ProductStatus.ACTIVE },
    },
    _count: {
      productId: true,
    },
  });

  const countByCategoryId = new Map(grouped.map((row) => [row.categoryId, row._count.productId]));
  const emptySubcategories = subcategoryIds.filter((id) => (countByCategoryId.get(id) ?? 0) === 0);

  if (emptySubcategories.length > 0) {
    throw new Error(`Hay subcategorias sin productos activos: ${emptySubcategories.join(', ')}`);
  }

  console.log(`Productos listos: ${productCount}`);

  return {
    categoryCount,
    subcategoryCount,
    productCount,
    persistedProducts,
  };
}

async function seedOrdersAndSales(persistedProducts: PersistedProduct[]): Promise<{
  orderCount: number;
  salesCount: number;
}> {
  if (persistedProducts.length === 0) {
    throw new Error('No hay productos para crear pedidos demo');
  }

  console.log('Generando pedidos, historial y ventas para admin...');

  const demoEmails = DEMO_CUSTOMERS.map((customer) => customer.email);
  await prisma.order.deleteMany({
    where: {
      customerEmail: { in: demoEmails },
    },
  });

  const statuses: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CONFIRMED,
    OrderStatus.DELIVERED,
    OrderStatus.SHIPPED,
    OrderStatus.PROCESSING,
    OrderStatus.DELIVERED,
    OrderStatus.PENDING,
    OrderStatus.DELIVERED,
    OrderStatus.SHIPPED,
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.DELIVERED,
  ];

  const destinationData = [
    { city: 'CABA', province: 'Buenos Aires', zip: 'C1001', street: 'Av Santa Fe' },
    { city: 'La Plata', province: 'Buenos Aires', zip: 'B1900', street: 'Calle 12' },
    { city: 'Cordoba', province: 'Cordoba', zip: 'X5000', street: 'Av Colon' },
    { city: 'Rosario', province: 'Santa Fe', zip: 'S2000', street: 'Bv Oroño' },
    { city: 'Mendoza', province: 'Mendoza', zip: 'M5500', street: 'Av San Martin' },
    { city: 'Neuquen', province: 'Neuquen', zip: 'Q8300', street: 'Mitre' },
  ];

  const carriers = ['Andreani', 'Correo Argentino', 'OCA', 'Urbano'];

  const historyNote: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'Pedido recibido y pendiente de confirmacion',
    [OrderStatus.CONFIRMED]: 'Pago validado y pedido confirmado',
    [OrderStatus.PROCESSING]: 'Pedido en preparacion de deposito',
    [OrderStatus.SHIPPED]: 'Pedido despachado al operador logistico',
    [OrderStatus.DELIVERED]: 'Pedido completado y entregado al cliente',
    [OrderStatus.CANCELLED]: 'Pedido cancelado por el comercio',
  };

  let orderCount = 0;
  let salesCount = 0;

  for (let i = 0; i < statuses.length; i += 1) {
    const finalStatus = statuses[i];
    if (finalStatus === undefined) continue;
    const customer = DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length];
    const baseDate = makeRecentDate(2 + ((i * 2) % 28), 9 + (i % 8));

    const itemCount = 2 + (i % 3);
    const items: Array<{
      productId: string;
      productName: string;
      productImage: string;
      quantity: number;
      unitPrice: number;
    }> = [];

    for (let itemIndex = 0; itemIndex < itemCount; itemIndex += 1) {
      const product = persistedProducts[(i * 5 + itemIndex * 7) % persistedProducts.length];
      const quantity = 1 + ((i + itemIndex) % 3);

      items.push({
        productId: product.id,
        productName: product.name,
        productImage: product.images[0] ?? '',
        quantity,
        unitPrice: product.price,
      });
    }

    const total = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

    const paymentStatus =
      finalStatus === OrderStatus.PENDING || (finalStatus === OrderStatus.CONFIRMED && i % 2 === 0)
        ? PaymentStatus.UNPAID
        : PaymentStatus.PAID;

    const paidAt =
      paymentStatus === PaymentStatus.PAID
        ? new Date(baseDate.getTime() + 8 * 60 * 60 * 1000)
        : null;

    const order = await prisma.order.create({
      data: {
        customerFirstName: customer.firstName,
        customerLastName: customer.lastName,
        customerEmail: customer.email,
        total,
        status: toPrismaOrderStatus(finalStatus),
        paymentStatus: toPrismaPaymentStatus(paymentStatus),
        paidAt,
        notes:
          finalStatus === OrderStatus.DELIVERED
            ? 'Pedido completado y entregado sin incidencias.'
            : 'Pedido demo para panel admin con actividad realista.',
        createdAt: baseDate,
        updatedAt: new Date(baseDate.getTime() + 3 * 60 * 60 * 1000),
      },
    });

    await prisma.orderItem.createMany({
      data: items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });

    const history = buildStatusHistory(finalStatus);
    for (let historyIndex = 0; historyIndex < history.length; historyIndex += 1) {
      const status = history[historyIndex];
      if (status === undefined) continue;
      const changedAt = new Date(baseDate.getTime() + historyIndex * 6 * 60 * 60 * 1000);

      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: toPrismaOrderStatus(status as OrderStatus),
          changedAt,
          note: historyNote[status as OrderStatus],
        },
      });
    }

    const soldAt = paidAt ?? new Date(baseDate.getTime() + 12 * 60 * 60 * 1000);

    await prisma.sale.upsert({
      where: { orderId: order.id },
      update: {
        total,
        soldAt,
      },
      create: {
        orderId: order.id,
        total,
        soldAt,
        createdAt: soldAt,
      },
    });
    salesCount += 1;

    if (finalStatus === OrderStatus.SHIPPED || finalStatus === OrderStatus.DELIVERED) {
      const destination = destinationData[i % destinationData.length];
      const shippedAt = new Date(baseDate.getTime() + (24 + (i % 6)) * 60 * 60 * 1000);
      const deliveredAt =
        finalStatus === OrderStatus.DELIVERED
          ? new Date(shippedAt.getTime() + (24 + (i % 4) * 6) * 60 * 60 * 1000)
          : null;

      await prisma.shipment.upsert({
        where: { orderId: order.id },
        update: {
          addressStreet: `${destination.street} ${420 + i * 7}`,
          addressCity: destination.city,
          addressProvince: destination.province,
          addressZip: destination.zip,
          carrier: carriers[i % carriers.length],
          trackingNumber: `TRK-ALM-${String(7000 + i).padStart(4, '0')}`,
          status: finalStatus === OrderStatus.DELIVERED ? 'entregado' : 'enviado',
          shippedAt,
          deliveredAt,
        },
        create: {
          orderId: order.id,
          addressStreet: `${destination.street} ${420 + i * 7}`,
          addressCity: destination.city,
          addressProvince: destination.province,
          addressZip: destination.zip,
          carrier: carriers[i % carriers.length],
          trackingNumber: `TRK-ALM-${String(7000 + i).padStart(4, '0')}`,
          status: finalStatus === OrderStatus.DELIVERED ? 'entregado' : 'enviado',
          shippedAt,
          deliveredAt,
          createdAt: shippedAt,
        },
      });
    }

    orderCount += 1;
  }

  console.log(`Pedidos demo: ${orderCount}, ventas/transacciones: ${salesCount}`);

  return { orderCount, salesCount };
}

async function seedDemo() {
  try {
    console.log('Iniciando seed DEMO robusto de Allmart...');

    const generatedProducts = buildDemoProducts(DEMO_CATEGORIES);
    validateCatalog(DEMO_CATEGORIES, generatedProducts);

    const userCount = await seedUsers();

    const {
      categoryCount,
      subcategoryCount,
      productCount,
      persistedProducts,
    } = await seedCategoriesAndProducts(generatedProducts);

    const { orderCount, salesCount } = await seedOrdersAndSales(persistedProducts);

    console.log('=============================================');
    console.log('SEED DEMO COMPLETADO');
    console.log('=============================================');
    console.log(`Usuarios activos: ${userCount}`);
    console.log(`Categorias raiz: ${categoryCount}`);
    console.log(`Subcategorias: ${subcategoryCount}`);
    console.log(`Productos cargados: ${productCount}`);
    console.log(`Pedidos demo: ${orderCount}`);
    console.log(`Ventas/transacciones demo: ${salesCount}`);
    console.log('Nota: estado "completed" del negocio se mapea a "entregado" por schema actual.');
    console.log('=============================================');
  } catch (error) {
    console.error('Error ejecutando seed_demo.ts:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemo();
