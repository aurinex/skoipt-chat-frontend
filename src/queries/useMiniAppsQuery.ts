import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

export const useMiniAppsQuery = () => {
  return useQuery({
    queryKey: ["mini-apps"],
    queryFn: api.miniApps.get,
  });
};
