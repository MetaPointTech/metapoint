export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];
export interface Data {
  [key: string]: Json;
  value: number;
}
