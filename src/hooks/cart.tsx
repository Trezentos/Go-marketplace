import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketPlace:products',
      );
      if (storagedProducts) setProducts([...JSON.parse(storagedProducts)]);
    }
    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const existingProduct = products.find(
        productFound => productFound.id === product.id,
      );

      if (!existingProduct) {
        return setProducts([...products, { ...product, quantity: 1 }]);
      }

      const newProducts = products.map(p =>
        p.id === existingProduct.id ? { ...p, quantity: p.quantity + 1 } : p,
      );

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(newProducts),
      );
      return setProducts(newProducts);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const existingProduct = products.find(
        productFound => productFound.id === id,
      );

      if (existingProduct)
        await AsyncStorage.setItem(
          '@GoMarketPlace',
          JSON.stringify(existingProduct),
        );

      const newProducts = products.map(product => {
        if (product.id === id) {
          return {
            ...product,
            quantity: product.quantity + 1,
          };
        }
        return product;
      });

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(newProducts),
      );
      return setProducts(newProducts);
    },

    [products],
  );

  const decrement = useCallback(
    async id => {
      const existingProduct = products.find(
        productFound => productFound.id === id,
      );

      if (existingProduct?.quantity === 1) {
        return setProducts(products.filter(product => product.id !== id));
      }

      const newProducts = products.map(product => {
        if (product.id === id) {
          return {
            ...product,
            quantity: product.quantity - 1,
          };
        }
        return product;
      });

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(newProducts),
      );
      return setProducts(newProducts);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
