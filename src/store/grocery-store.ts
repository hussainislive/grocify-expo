import { create } from "zustand";
import { Platform } from "react-native";

export type GroceryCategory =
  | "Produce"
  | "Dairy"
  | "Bakery"
  | "Pantry"
  | "Snacks";

export type GroceryPriority = "low" | "medium" | "high";

export type GroceryItem = {
  id: string;
  name: string;
  category: GroceryCategory;
  quantity: number;
  purchased: boolean;
  priority: GroceryPriority;
};

export type CreateItemInput = {
  name: string;
  category: GroceryCategory;
  quantity: number;
  priority: GroceryPriority;
};

type ItemsResponse = { items: GroceryItem[] };
type ItemResponse = { item: GroceryItem };

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

const getApiUrl = (path: string) => {
  if (apiBaseUrl) return `${apiBaseUrl}${path}`;
  if (Platform.OS === "web") return path;
  throw new Error(
    "Missing EXPO_PUBLIC_API_BASE_URL. Set it to your deployed API origin.",
  );
};

const readResponsePayload = async <T>(res: Response) => {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

const getErrorMessage = (status: number, payload: unknown) => {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = payload.error;
    if (typeof error === "string" && error.trim().length > 0) return error;
  }
  return `Request failed (${status})`;
};

type GroceryStore = {
  items: GroceryItem[];
  isLoading: boolean;
  error: string | null;
  /** Call this from a React component (e.g. layout) after Clerk token is available */
  setAuthToken: (token: string | null) => void;
  loadItems: () => Promise<void>;
  addItem: (input: CreateItemInput) => Promise<GroceryItem | void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  togglePurchased: (id: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearPurchased: () => Promise<void>;
};

// Stored outside Zustand state so it never triggers re-renders
let _authToken: string | null = null;

const authHeaders = (): Record<string, string> =>
  _authToken ? { Authorization: `Bearer ${_authToken}` } : {};

export const useGroceryStore = create<GroceryStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  setAuthToken: (token) => {
    _authToken = token;
  },

  loadItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(getApiUrl("/api/items"), {
        headers: authHeaders(),
      });
      const payload = await readResponsePayload<ItemsResponse>(res);

      if (!res.ok) throw new Error(getErrorMessage(res.status, payload));
      set({ items: payload?.items ?? [] });
    } catch (error) {
      console.error("Error loading items:", error);
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (input) => {
    set({ error: null });
    try {
      const res = await fetch(getApiUrl("/api/items"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          name: input.name,
          category: input.category,
          quantity: Math.max(1, input.quantity),
          priority: input.priority,
        }),
      });
      const payload = await readResponsePayload<ItemResponse>(res);
      if (!res.ok) throw new Error(getErrorMessage(res.status, payload));
      if (!payload?.item) throw new Error("Item was not returned by the API");

      set((state) => ({ items: [payload.item, ...state.items] }));
      return payload.item;
    } catch (error) {
      console.error("Error adding item:", error);
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      set({ error: message });
    }
  },

  updateQuantity: async (id, quantity) => {
    const nextQuantity = Math.max(1, quantity);
    set({ error: null });

    try {
      const res = await fetch(getApiUrl(`/api/items/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ quantity: nextQuantity }),
      });
      const payload = await readResponsePayload<ItemResponse>(res);
      if (!res.ok) throw new Error(getErrorMessage(res.status, payload));
      if (!payload?.item) throw new Error("Item was not returned by the API");
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? payload.item : item,
        ),
      }));
    } catch (error) {
      console.error("Error updating quantity:", error);
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      set({ error: message });
    }
  },

  togglePurchased: async (id) => {
    const currentItem = get().items.find((item) => item.id === id);
    if (!currentItem) return;

    const nextPurchased = !currentItem.purchased;
    set({ error: null });
    try {
      const res = await fetch(getApiUrl(`/api/items/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ purchased: nextPurchased }),
      });

      const payload = await readResponsePayload<ItemResponse>(res);
      if (!res.ok) throw new Error(getErrorMessage(res.status, payload));
      if (!payload?.item) throw new Error("Item was not returned by the API");

      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? payload.item : item,
        ),
      }));
    } catch (error) {
      console.error("Error toggling purchased:", error);
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      set({ error: message });
    }
  },

  removeItem: async (id) => {
    set({ error: null });
    try {
      const res = await fetch(getApiUrl(`/api/items/${id}`), {
        method: "DELETE",
        headers: authHeaders(),
      });
      const payload = await readResponsePayload(res);
      if (!res.ok) throw new Error(getErrorMessage(res.status, payload));

      set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
    } catch (error) {
      console.error("Error removing item:", error);
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      set({ error: message });
    }
  },

  clearPurchased: async () => {
    set({ error: null });
    try {
      const res = await fetch(getApiUrl("/api/items/clear-purchased"), {
        method: "POST",
        headers: authHeaders(),
      });
      const payload = await readResponsePayload(res);
      if (!res.ok) throw new Error(getErrorMessage(res.status, payload));

      const items = get().items.filter((item) => !item.purchased);
      set({ items });
    } catch (error) {
      console.error("Error clearing purchased:", error);
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      set({ error: message });
    }
  },
}));
