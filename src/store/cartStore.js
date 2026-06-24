import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ANONYMOUS_CART_KEY } from '../utils/constants';
import { cartApi } from '../api/cart.api';
import { v4 as uuidv4 } from 'uuid';

const getOrCreateAnonymousId = () => {
  let id = localStorage.getItem(ANONYMOUS_CART_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(ANONYMOUS_CART_KEY, id);
  }
  return id;
};

const useCartStore = create(
  persist(
    (set, get) => ({
      cart: null,
      loading: false,

      getCartParams: (userId) => {
        if (userId) return { userId };
        return { anonymousId: getOrCreateAnonymousId() };
      },

      fetchCart: async (userId) => {
        set({ loading: true });
        try {
          const params = get().getCartParams(userId);
          const { data } = await cartApi.getCart(params);
          set({ cart: data });
        } catch {
          set({ cart: null });
        } finally {
          set({ loading: false });
        }
      },

      addItem: async (userId, itemData) => {
        const params = get().getCartParams(userId);
        await cartApi.addItem({ ...params, ...itemData });
        await get().fetchCart(userId);
      },

      updateItem: async (userId, itemId, quantity) => {
        await cartApi.updateItem(itemId, { quantity });
        await get().fetchCart(userId);
      },

      removeItem: async (userId, itemId) => {
        await cartApi.removeItem(itemId);
        await get().fetchCart(userId);
      },

      clearCart: async (userId) => {
        const params = get().getCartParams(userId);
        await cartApi.clearCart(params);
        set({ cart: null });
      },

      getTotalItems: () => {
        const items = get().cart?.items || [];
        return items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        const items = get().cart?.items || [];
        return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      },
    }),
    {
      name: 'urban-cart',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);

export default useCartStore;
