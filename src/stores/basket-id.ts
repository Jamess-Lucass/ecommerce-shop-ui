import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface State {
  basketId: string | undefined;
  setBasketId: (id: string | undefined) => void;
}

export const useBasketIdStore = create<State>()(
  devtools(
    persist(
      (set) => ({
        basketId: undefined,
        setBasketId: (id) =>
          set(() => ({
            basketId: id,
          })),
      }),
      {
        name: "basket-id",
      }
    )
  )
);
