import { Box, useTheme } from "@mui/material";
import DropZoneOverlay from "../Ui/DropZoneOverlay";
import FileUploadModal from "../Ui/FileUploadModal";

interface ChatShellProps {
  children: React.ReactNode;
  modalOpen: boolean;
  modalFiles: File[];
  modalInitialCaption: string;
  onModalClose: () => void;
  onModalSend: (files: File[], caption: string) => Promise<void>;
  onAddMoreFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onFilesDrop: (files: File[]) => void;
}

/**
 * Обёртка над чатом — drag&drop зона и модалка загрузки файлов.
 * ImageViewer остаётся в компоненте который его использует (ActiveChat),
 * так как ему нужен onImageClick из MessageList.
 */
const ChatShell = ({
  children,
  modalOpen,
  modalFiles,
  modalInitialCaption,
  onModalClose,
  onModalSend,
  onAddMoreFiles,
  onRemoveFile,
  onFilesDrop,
}: ChatShellProps) => {
  const theme = useTheme();
  const colors = theme.palette.background;

  return (
    <DropZoneOverlay onFilesDrop={onFilesDrop} colors={colors}>
      <FileUploadModal
        open={modalOpen}
        files={modalFiles}
        onClose={onModalClose}
        onSend={onModalSend}
        onAddMore={onAddMoreFiles}
        onRemove={onRemoveFile}
        initialCaption={modalInitialCaption}
        colors={colors}
      />
      {children}
    </DropZoneOverlay>
  );
};

export default ChatShell;
