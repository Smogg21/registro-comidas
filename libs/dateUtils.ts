export const getLocalYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  // getMonth() devuelve 0-11, por eso sumamos 1. padStart asegura que tengamos dos dígitos (ej: 06).
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};