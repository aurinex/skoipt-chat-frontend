import type { MiniApps } from "../../types";
import { request } from "./transport";

export const miniApps = {
  async get() {
    return request<MiniApps[]>("/mini-apps/");
  },

  async launch(appId: string) {
    return request<{ url: string; token: string }>(
      `/mini-apps/${appId}/launch`,
      {
        method: "POST",
      },
    );
  },
};
