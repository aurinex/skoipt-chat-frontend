export interface SpecialtyDirectoryItem {
  prefix: string;
  specialty: string;
  code: string;
}

export const SPECIALTIES_URL =
  "https://gist.githubusercontent.com/DIKER0K/fde894801d94a4983bfd9c31d5bb61d6/raw/6732b9709edd6bc56ff0c6856f2d54fb266c916c/specialties.json";

const normalizeGroup = (group?: string | null) =>
  (group ?? "").trim().toUpperCase();

export const fetchSpecialtiesDirectory = async () => {
  const response = await fetch(SPECIALTIES_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch specialties: ${response.status}`);
  }

  const data = (await response.json()) as SpecialtyDirectoryItem[];

  return [...data].sort((left, right) => right.prefix.length - left.prefix.length);
};

export const getSpecialtyByGroup = (
  group: string | null | undefined,
  directory: SpecialtyDirectoryItem[],
) => {
  const normalizedGroup = normalizeGroup(group);

  if (!normalizedGroup) {
    return null;
  }

  return (
    directory.find((item) =>
      normalizedGroup.startsWith(item.prefix.trim().toUpperCase()),
    ) ?? null
  );
};
