import type { Attachment } from "../../types";
import { request, requestFormData } from "./transport";

export const files = {
  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await requestFormData<{
      avatar_url?: string;
      url?: string;
      object_name?: string;
      is_public?: boolean;
    }>("/files/avatar", formData);

    return {
      ...response,
      avatar_url: response.avatar_url ?? response.url ?? null,
    };
  },

  async uploadChatAvatar(chatId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return requestFormData<{
      avatar_url: string;
    }>(`/files/chat/${chatId}/avatar`, formData);
  },

  async uploadChatFile(chatId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return requestFormData<Attachment | { attachment: Attachment }>(
      `/files/chat/${chatId}`,
      formData,
    );
  },

  async getPrivateUrl(chatId: string, objectName: string) {
    return request<{ url: string }>(`/files/chat/${chatId}/${objectName}`);
  },
};
