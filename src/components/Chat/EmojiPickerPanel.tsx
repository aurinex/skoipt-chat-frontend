import EmojiPicker, { Theme } from "emoji-picker-react";

interface EmojiPickerPanelProps {
  theme: "dark" | "light";
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPickerPanel = ({
  theme,
  onEmojiSelect,
}: EmojiPickerPanelProps) => {
  return (
    <EmojiPicker
      searchDisabled
      theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
      onEmojiClick={(emojiData) => {
        onEmojiSelect(emojiData.emoji);
      }}
    />
  );
};

export default EmojiPickerPanel;
