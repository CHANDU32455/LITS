// types/global.d.ts
declare namespace NodeJS {
  interface Timeout {
    ref(): unknown;
    unref(): unknown;
    hasRef?(): boolean;
    refresh?(): unknown;
    [Symbol.toPrimitive]?(): number;
  }
}