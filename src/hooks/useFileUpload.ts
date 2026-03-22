import { useState, useCallback } from "react";

/**
 * Управляет состоянием модалки загрузки файлов.
 * Используется в ActiveChat и NewChat.
 */
export const useFileUpload = (draftText: string, onClearDraft: () => void) => {
  const [modalFiles, setModalFiles] = useState<File[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialCaption, setModalInitialCaption] = useState("");

  const openModal = useCallback(
    (files: File[]) => {
      setModalFiles((prev) => [...prev, ...files].slice(0, 10));
      if (draftText.trim()) {
        setModalInitialCaption(draftText);
        onClearDraft();
      }
      setModalOpen(true);
    },
    [draftText, onClearDraft],
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalFiles([]);
    setModalInitialCaption("");
  }, []);

  const addFiles = useCallback((files: File[]) => {
    setModalFiles((prev) => [...prev, ...files].slice(0, 10));
  }, []);

  const removeFile = useCallback((index: number) => {
    setModalFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) setModalOpen(false);
      return updated;
    });
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length) openModal(files);
      e.target.value = "";
    },
    [openModal],
  );

  return {
    modalFiles,
    modalOpen,
    modalInitialCaption,
    openModal,
    closeModal,
    addFiles,
    removeFile,
    handleFileInputChange,
  };
};
