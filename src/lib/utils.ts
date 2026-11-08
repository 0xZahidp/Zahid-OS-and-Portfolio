import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DEFAULT_COMPANY_LOGO } from "./constants";

export { DEFAULT_COMPANY_LOGO };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


