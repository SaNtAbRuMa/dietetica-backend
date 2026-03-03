export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  inStock: boolean;
  characteristics: string[];
  variants?: Product[]; // <-- ESTA ES LA MAGIA NUEVA
}

export interface CartItem {
  product: Product;
  quantity: number;
}