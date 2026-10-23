// Calcul précis de la semaine ISO 8601

export interface WeekInfo {
  year: number;
  week: number;
}

export const getCurrentWeek = (): WeekInfo => {
  const date = new Date();
  return getWeekFromDate(date);
};

export const getWeekFromDate = (date: Date): WeekInfo => {
  // Copier la date pour ne pas modifier l'originale
  const tempDate = new Date(date.getTime());

  // Définir au jeudi de la semaine
  tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));

  // Obtenir le premier janvier de l'année
  const yearStart = new Date(tempDate.getFullYear(), 0, 1);

  // Calculer le nombre de semaines complètes entre les dates
  const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return {
    year: tempDate.getFullYear(),
    week: weekNo,
  };
};

export const isFutureWeek = (year: number, week: number): boolean => {
  const current = getCurrentWeek();
  if (year > current.year) return true;
  if (year === current.year && week > current.week) return true;
  return false;
};

export const isCurrentWeek = (year: number, week: number): boolean => {
  const current = getCurrentWeek();
  return year === current.year && week === current.week;
};

export const getDateRangeForWeek = (year: number, week: number): { start: Date; end: Date } => {
  // Créer une date pour le 4 janvier (toujours dans la semaine 1)
  const jan4 = new Date(year, 0, 4);

  // Trouver le lundi de la semaine 1
  const weekOneMonday = new Date(jan4.getTime());
  weekOneMonday.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1);

  // Calculer le lundi de la semaine demandée
  const weekMonday = new Date(weekOneMonday.getTime());
  weekMonday.setDate(weekOneMonday.getDate() + (week - 1) * 7);

  // Le vendredi de cette semaine
  const weekFriday = new Date(weekMonday.getTime());
  weekFriday.setDate(weekMonday.getDate() + 4);

  return {
    start: weekMonday,
    end: weekFriday,
  };
};
