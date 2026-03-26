import type {
  Attachment,
  AttachmentPreview,
  Message,
  MessageType,
} from "../types";

const inferKindFromUrl = (value: string): Attachment["kind"] => {
  const lower = value.toLowerCase();

  if (
    lower.startsWith("blob:") ||
    /\.(jpg|jpeg|png|gif|webp|bmp|svg|avif)$/i.test(lower)
  ) {
    return "image";
  }

  if (/\.(mp3|ogg|webm|wav|m4a|aac|flac)$/i.test(lower)) {
    return "voice";
  }

  return "file";
};

export const getMessageAttachments = (message: Message): Attachment[] => {
  if (message.attachments?.length) {
    return message.attachments;
  }

  const legacyUrls = message.file_urls?.length
    ? message.file_urls
    : message.file_url
      ? [message.file_url]
      : [];

  return legacyUrls.map((value) => ({
    kind: inferKindFromUrl(value),
    url: value.startsWith("http") || value.startsWith("blob:") ? value : null,
    object_name:
      value.startsWith("http") || value.startsWith("blob:") ? null : value,
    is_public: value.startsWith("http") || value.startsWith("blob:"),
    filename: value.split("/").pop() ?? value,
  }));
};

export const getAttachmentSource = (attachment: Attachment) =>
  attachment.url ?? attachment.object_name ?? "";

export const getAttachmentPreviewSource = (attachment: Attachment) =>
  attachment.preview?.url ?? attachment.preview?.object_name ?? "";

export const hasAttachmentPreview = (attachment: Attachment) =>
  Boolean(getAttachmentPreviewSource(attachment));

export const getBestImageDisplaySource = (attachment: Attachment) =>
  getAttachmentPreviewSource(attachment) || getAttachmentSource(attachment);

export const getAttachmentPreviewLike = (
  attachment: Attachment,
): AttachmentPreview | Attachment =>
  attachment.preview && hasAttachmentPreview(attachment)
    ? attachment.preview
    : attachment;

export const getAttachmentTargetSource = (attachment: Attachment) =>
  getAttachmentSource(attachment);

export const isImageAttachment = (attachment: Attachment) =>
  attachment.kind === "image" ||
  attachment.mime_type?.startsWith("image/") === true ||
  /\.(jpg|jpeg|png|gif|webp|bmp|svg|avif)$/i.test(
    getAttachmentSource(attachment),
  );

export const isVoiceAttachment = (attachment: Attachment) =>
  attachment.kind === "voice" ||
  attachment.mime_type?.startsWith("audio/") === true;

export const inferMessageType = (message: Message): MessageType => {
  if (message.type) return message.type;
  if (message.is_system) return "system";

  const attachments = getMessageAttachments(message);
  if (attachments.length === 0) return "text";

  if (attachments.length === 1 && isVoiceAttachment(attachments[0])) {
    return "voice";
  }

  if (attachments.every(isImageAttachment)) {
    return "image";
  }

  return "file";
};

export const splitMessageAttachments = (message: Message) => {
  const attachments = getMessageAttachments(message);

  return {
    attachments,
    imageAttachments: attachments.filter(isImageAttachment),
    voiceAttachments: attachments.filter(isVoiceAttachment),
    fileAttachments: attachments.filter(
      (attachment) => !isImageAttachment(attachment) && !isVoiceAttachment(attachment),
    ),
  };
};

export const unwrapUploadedAttachment = <T extends Attachment | { attachment: Attachment }>(
  payload: T,
): Attachment => {
  if ("attachment" in payload) {
    return payload.attachment;
  }

  return payload;
};

export const buildAttachmentFromUpload = <
  T extends Attachment | { attachment: Attachment },
>(
  file: File,
  payload: T,
): Attachment => {
  const raw = unwrapUploadedAttachment(payload);
  const inferredKind: Attachment["kind"] = file.type.startsWith("image/")
    ? "image"
    : file.type.startsWith("audio/")
      ? "voice"
      : "file";

  return {
    ...raw,
    kind: raw.kind ?? inferredKind,
    mime_type: raw.mime_type ?? file.type,
    filename: raw.filename ?? file.name,
    size_bytes: raw.size_bytes ?? file.size,
  };
};
