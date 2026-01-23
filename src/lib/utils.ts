
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseFullName(fullName: string) {
  const nameParts = fullName.trim().split(/\s+/);
  let apellidoPaterno = '';
  let apellidoMaterno: string | undefined = undefined;
  let nombre = '';

  if (nameParts.length > 2) {
    // [Name...] [Paternal] [Maternal]
    apellidoMaterno = nameParts[nameParts.length - 1]; // Last part is Maternal
    apellidoPaterno = nameParts[nameParts.length - 2]; // Second to last is Paternal
    nombre = nameParts.slice(0, nameParts.length - 2).join(' '); // Rest is Name
  } else if (nameParts.length === 2) {
    // [Name] [Paternal]
    apellidoPaterno = nameParts[nameParts.length - 1];
    nombre = nameParts[0];
  } else {
    // [Name]
    nombre = nameParts[0];
    apellidoPaterno = 'SIN_APELLIDO';
  }

  return { nombre, apellidoPaterno, apellidoMaterno };
}
