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
      const storagedItems = await AsyncStorage.getItem(
        '@GoMarketplace:cartItems',
      );

      if (storagedItems) {
        setProducts(JSON.parse(storagedItems));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(item => item.id === product.id);

      if (productExists) {
        setProducts(
          products.map(p =>
            p.id === product.id
              ? {
                  ...product,
                  quantity: p.quantity + 1,
                }
              : p,
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:cartItems',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productExists = products.find(product => product.id === id);

      if (productExists) {
        setProducts(
          products.map(product =>
            product.id === id
              ? { ...product, quantity: product.quantity + 1 }
              : product,
          ),
        );
        await AsyncStorage.setItem(
          '@GoMarketplace:cartItems',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productExists = products.find(product => product.id === id);

      if (productExists) {
        if (productExists.quantity === 1) {
          setProducts(
            products.filter(product => product.id !== productExists.id),
          );
        } else {
          setProducts(
            products.map(product =>
              product.id === id
                ? { ...product, quantity: product.quantity - 1 }
                : product,
            ),
          );
        }
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:cartItems',
        JSON.stringify(products),
      );
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
