import { useMemo } from "react";
import { useComposerStore } from "../stores/useComposerStore";
import type { Message } from "../types";

const EMPTY_FILES: File[] = [];

export const useComposer = (scopeId: string) => {
  const draftText = useComposerStore(
    (state) => state.composers[scopeId]?.draftText ?? "",
  );
  const replyTo = useComposerStore(
    (state) => state.composers[scopeId]?.replyTo ?? null,
  );
  const modalFiles = useComposerStore(
    (state) => state.composers[scopeId]?.modalFiles ?? EMPTY_FILES,
  );
  const modalOpen = useComposerStore(
    (state) => state.composers[scopeId]?.modalOpen ?? false,
  );
  const modalInitialCaption = useComposerStore(
    (state) => state.composers[scopeId]?.modalInitialCaption ?? "",
  );

  const setDraftTextForScope = useComposerStore((state) => state.setDraftText);
  const setReplyToForScope = useComposerStore((state) => state.setReplyTo);
  const openModalForScope = useComposerStore((state) => state.openModal);
  const closeModalForScope = useComposerStore((state) => state.closeModal);
  const addFilesForScope = useComposerStore((state) => state.addFiles);
  const removeFileForScope = useComposerStore((state) => state.removeFile);
  const resetComposerForScope = useComposerStore(
    (state) => state.resetComposer,
  );

  const setDraftText = useMemo(
    () => (value: string) => setDraftTextForScope(scopeId, value),
    [scopeId, setDraftTextForScope],
  );

  const setReplyTo = useMemo(
    () => (message: Message | null) => setReplyToForScope(scopeId, message),
    [scopeId, setReplyToForScope],
  );

  const openModal = useMemo(
    () => (files: File[]) => openModalForScope(scopeId, files),
    [scopeId, openModalForScope],
  );

  const closeModal = useMemo(
    () => () => closeModalForScope(scopeId),
    [scopeId, closeModalForScope],
  );

  const addFiles = useMemo(
    () => (files: File[]) => addFilesForScope(scopeId, files),
    [scopeId, addFilesForScope],
  );

  const removeFile = useMemo(
    () => (index: number) => removeFileForScope(scopeId, index),
    [scopeId, removeFileForScope],
  );

  const resetComposer = useMemo(
    () => () => resetComposerForScope(scopeId),
    [scopeId, resetComposerForScope],
  );

  const editingMessage = useComposerStore(
    (state) => state.composers[scopeId]?.editingMessage ?? null,
  );

  const setEditingMessageForScope = useComposerStore(
    (state) => state.setEditingMessage,
  );

  const setEditingMessage = useMemo(
    () => (msg: Message | null) => setEditingMessageForScope(scopeId, msg),
    [scopeId, setEditingMessageForScope],
  );

  const handleFileInputChange = useMemo(
    () => (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length) openModal(files);
      e.target.value = "";
    },
    [openModal],
  );

  return {
    draftText,
    setDraftText,
    replyTo,
    setReplyTo,
    modalFiles,
    modalOpen,
    modalInitialCaption,
    openModal,
    closeModal,
    addFiles,
    removeFile,
    handleFileInputChange,
    resetComposer,
    editingMessage,
    setEditingMessage,
  };
};
