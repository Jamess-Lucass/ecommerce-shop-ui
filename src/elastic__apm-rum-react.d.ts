// elastic__apm-rum-react.d.ts
declare module "@elastic/apm-rum-react" {
  import { ComponentType } from "react";

  export const withTransaction: (
    name: string,
    eventType: string
  ) => <T>(component: ComponentType<T>) => ComponentType<T>;
}
