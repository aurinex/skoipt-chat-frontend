export const parseChatDate = (dateStr: string) => {
  const isoStr =
    dateStr.includes("Z") || dateStr.includes("+")
      ? dateStr
      : `${dateStr.replace(" ", "T")}Z`;

  return new Date(isoStr);
};

export const getChatDateKey = (dateStr: string) =>
  parseChatDate(dateStr).toDateString();

export const formatLocalTime = (dateStr: string) => {
  const date = parseChatDate(dateStr);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const formatDateLabel = (dateStr: string) => {
  const date = parseChatDate(dateStr);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return "Сегодня";
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Вчера";
  }

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

export const getParticipantString = (count: number) => {
  const remainder10 = count % 10;
  const remainder100 = count % 100;

  if (remainder10 === 1 && remainder100 !== 11) {
    return `${count} участник`;
  }
  if (
    remainder10 >= 2 &&
    remainder10 <= 4 &&
    (remainder100 < 10 || remainder100 >= 20)
  ) {
    return `${count} участника`;
  }
  return `${count} участников`;
};
