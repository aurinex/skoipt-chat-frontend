import { create } from "zustand";
import type { Message } from "../types";

interface ComposerStateItem {
  draftText: string;
  replyTo: Message | null;
  modalFiles: File[];
  modalOpen: boolean;
  modalInitialCaption: string;
}

interface ComposerStoreState {
  composers: Record<string, ComposerStateItem>;
  setDraftText: (scopeId: string, value: string) => void;
  setReplyTo: (scopeId: string, message: Message | null) => void;
  openModal: (scopeId: string, files: File[]) => void;
  closeModal: (scopeId: string) => void;
  addFiles: (scopeId: string, files: File[]) => void;
  removeFile: (scopeId: string, index: number) => void;
  resetComposer: (scopeId: string) => void;
}

const EMPTY_FILES: File[] = [];

const createComposerState = (): ComposerStateItem => ({
  draftText: "",
  replyTo: null,
  modalFiles: EMPTY_FILES,
  modalOpen: false,
  modalInitialCaption: "",
});

export const useComposerStore = create<ComposerStoreState>((set) => ({
  composers: {},

  setDraftText: (scopeId, value) =>
    set((state) => ({
      composers: {
        ...state.composers,
        [scopeId]: {
          ...(state.composers[scopeId] ?? createComposerState()),
          draftText: value,
        },
      },
    })),

  setReplyTo: (scopeId, message) =>
    set((state) => ({
      composers: {
        ...state.composers,
        [scopeId]: {
          ...(state.composers[scopeId] ?? createComposerState()),
          replyTo: message,
        },
      },
    })),

  openModal: (scopeId, files) =>
    set((state) => {
      const current = state.composers[scopeId] ?? createComposerState();
      const nextFiles = [...current.modalFiles, ...files].slice(0, 10);
      const shouldMoveDraft = current.draftText.trim().length > 0;

      return {
        composers: {
          ...state.composers,
          [scopeId]: {
            ...current,
            modalFiles: nextFiles,
            modalOpen: true,
            modalInitialCaption: shouldMoveDraft
              ? current.draftText
              : current.modalInitialCaption,
            draftText: shouldMoveDraft ? "" : current.draftText,
          },
        },
      };
    }),

  closeModal: (scopeId) =>
    set((state) => {
      const current = state.composers[scopeId] ?? createComposerState();

      return {
        composers: {
          ...state.composers,
          [scopeId]: {
            ...current,
            modalOpen: false,
            modalFiles: EMPTY_FILES,
            modalInitialCaption: "",
          },
        },
      };
    }),

  addFiles: (scopeId, files) =>
    set((state) => {
      const current = state.composers[scopeId] ?? createComposerState();

      return {
        composers: {
          ...state.composers,
          [scopeId]: {
            ...current,
            modalFiles: [...current.modalFiles, ...files].slice(0, 10),
          },
        },
      };
    }),

  removeFile: (scopeId, index) =>
    set((state) => {
      const current = state.composers[scopeId] ?? createComposerState();
      const nextFiles = current.modalFiles.filter((_, i) => i !== index);

      return {
        composers: {
          ...state.composers,
          [scopeId]: {
            ...current,
            modalFiles: nextFiles,
            modalOpen: nextFiles.length > 0 ? current.modalOpen : false,
          },
        },
      };
    }),

  resetComposer: (scopeId) =>
    set((state) => ({
      composers: {
        ...state.composers,
        [scopeId]: createComposerState(),
      },
    })),
}));
