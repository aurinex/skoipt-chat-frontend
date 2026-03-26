import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchSpecialtiesDirectory } from "../utils/specialties";

export const useSpecialtiesQuery = () =>
  useQuery({
    queryKey: queryKeys.directories.specialties,
    queryFn: fetchSpecialtiesDirectory,
    staleTime: 1000 * 60 * 60,
  });
