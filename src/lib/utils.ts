import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DEFAULT_COMPANY_LOGO, DEFAULT_PERSON_AVATAR } from "./constants";

export { DEFAULT_COMPANY_LOGO, DEFAULT_PERSON_AVATAR };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


