import { Product } from '../types';

export const products: Product[] = [
  {
    id: '1',
    name: 'Almendras Nonpareil',
    description: 'Almendras enteras de primera calidad, ideales para snacks o repostería.',
    price: 4500,
    imageUrl: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&q=80&w=800',
    inStock: true,
    characteristics: ['Ricas en vitamina E', 'Sin TACC', 'Fuente de proteínas'],
    category: 'Frutos Secos'
  },
  {
    id: '2',
    name: 'Nuez Mariposa Extra Light',
    description: 'Nueces peladas de alta calidad, perfectas para el cerebro y el corazón.',
    price: 6200,
    imageUrl: 'https://images.unsplash.com/photo-1599598425947-330026216d05?auto=format&fit=crop&q=80&w=800',
    inStock: true,
    characteristics: ['Omega 3', 'Antioxidantes', 'Sin conservantes'],
    category: 'Frutos Secos'
  },
  {
    id: '3',
    name: 'Avena Arrollada Fina',
    description: 'Avena de cocción rápida, ideal para desayunos y licuados.',
    price: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800',
    inStock: true,
    characteristics: ['Alta en fibra', 'Energía prolongada', 'Vegano'],
    category: 'Cereales'
  },
  {
    id: '4',
    name: 'Mantequilla de Maní Natural',
    description: '100% maní tostado, sin azúcar agregada ni aceites vegetales.',
    price: 3500,
    imageUrl: 'https://images.unsplash.com/photo-1584836659841-42415cd2a918?auto=format&fit=crop&q=80&w=800',
    inStock: false,
    characteristics: ['Sin azúcar', 'Keto friendly', 'Proteína vegetal'],
    category: 'Untables'
  },
  {
    id: '5',
    name: 'Miel Pura de Abeja',
    description: 'Miel de pradera, extracción en frío para conservar sus propiedades.',
    price: 2800,
    imageUrl: 'https://images.unsplash.com/photo-1587049352847-4d4b12405451?auto=format&fit=crop&q=80&w=800',
    inStock: true,
    characteristics: ['100% Natural', 'Sin pasteurizar', 'Endulzante natural'],
    category: 'Endulzantes'
  },
  {
    id: '6',
    name: 'Semillas de Chía',
    description: 'Superalimento rico en Omega 3 y fibra, ideal para puddings.',
    price: 1800,
    imageUrl: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&q=80&w=800',
    inStock: true,
    characteristics: ['Omega 3', 'Fibra soluble', 'Sin TACC'],
    category: 'Semillas'
  },
  {
    id: '7',
    name: 'Mix de Frutos Secos Premium',
    description: 'Mezcla de almendras, nueces, castañas de cajú y pasas de uva.',
    price: 5500,
    imageUrl: 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&q=80&w=800',
    inStock: true,
    characteristics: ['Snack saludable', 'Energético', 'Variedad de nutrientes'],
    category: 'Mixes'
  },
  {
    id: '8',
    name: 'Granola Artesanal con Miel',
    description: 'Avena, almendras, coco rallado y miel, horneada a la perfección.',
    price: 3200,
    imageUrl: 'https://images.unsplash.com/photo-1557342080-b2cdfc38f4f3?auto=format&fit=crop&q=80&w=800',
    inStock: true,
    characteristics: ['Crujiente', 'Desayuno completo', 'Hecho a mano'],
    category: 'Cereales'
  },
  {
    id: '9',
    name: 'Proteína de Arveja',
    description: 'Proteína vegetal aislada, ideal para deportistas y dietas veganas.',
    price: 8500,
    imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&q=80&w=800',
    inStock: true,
    characteristics: ['80% Proteína', 'Sin saborizantes', 'Vegano'],
    category: 'Suplementos'
  },
  {
    id: '10',
    name: 'Spirulina Orgánica en Polvo',
    description: 'Superalimento rico en hierro, vitaminas y antioxidantes.',
    price: 4200,
    imageUrl: 'https://images.unsplash.com/photo-1615486511484-92e172054b04?auto=format&fit=crop&q=80&w=800',
    inStock: true,
    characteristics: ['Detox', 'Energizante', 'Orgánico'],
    category: 'Suplementos'
  },
  {
    id: '11',
    name: 'Kombucha de Frutos Rojos',
    description: 'Bebida probiótica fermentada naturalmente, refrescante y saludable.',
    price: 1500,
    imageUrl: 'https://images.unsplash.com/photo-1595981267035-7b04d84b4f1e?auto=format&fit=crop&q=80&w=800',
    inStock: true,
    characteristics: ['Probiótico', 'Baja en calorías', 'Sin alcohol'],
    category: 'Bebidas'
  },
  {
    id: '12',
    name: 'Aceite de Coco Neutro',
    description: 'Aceite de coco de primera presión en frío, ideal para cocinar o cosmética.',
    price: 5800,
    imageUrl: 'https://images.unsplash.com/photo-1611078500661-8250269006b5?auto=format&fit=crop&q=80&w=800',
    inStock: true,
    characteristics: ['Prensado en frío', 'Multiuso', 'Keto'],
    category: 'Alimentos Naturales'
  }
];