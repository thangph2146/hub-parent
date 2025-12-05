/**
 * Uploads Store (Zustand)
 * Quản lý UI state cho uploads feature
 */

import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

interface ImageItem {
  fileName: string
  originalName: string
  size: number
  mimeType: string
  url: string
  relativePath: string
  createdAt: number
}

interface UploadsUIState {
  // View state
  viewMode: "flat" | "tree"
  currentPage: number
  
  // Selection state
  selectedImages: Set<string>
  selectedFolder: string | null
  
  // Folder tree UI state
  openFolders: Set<string>
  openFolderPaths: Set<string>
  openFolderPathsUpload: Set<string>
  openFolderPathsString: Set<string>
  
  // Popover states
  folderTreeSelectOpen: boolean
  folderTreeSelectOpenUpload: boolean
  folderTreeSelectOpenString: boolean
  
  // Create folder form state
  showCreateFolderForm: boolean
  folderInputMode: "tree" | "string"
  newFolderName: string
  parentFolderForCreate: string | null
  folderPathString: string
  rootFolderForString: string | null
  
  // Actions
  setViewMode: (mode: "flat" | "tree") => void
  setCurrentPage: (page: number) => void
  setSelectedImages: (images: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  setSelectedFolder: (folder: string | null) => void
  toggleImageSelection: (fileName: string) => void
  selectAllImages: (images: ImageItem[]) => void
  clearSelection: () => void
  
  // Folder tree actions
  setOpenFolders: (folders: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  toggleFolder: (path: string) => void
  setOpenFolderPaths: (paths: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  setOpenFolderPathsUpload: (paths: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  setOpenFolderPathsString: (paths: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  
  // Popover actions
  setFolderTreeSelectOpen: (open: boolean) => void
  setFolderTreeSelectOpenUpload: (open: boolean) => void
  setFolderTreeSelectOpenString: (open: boolean) => void
  
  // Create folder form actions
  setShowCreateFolderForm: (show: boolean) => void
  setFolderInputMode: (mode: "tree" | "string") => void
  setNewFolderName: (name: string) => void
  setParentFolderForCreate: (path: string | null) => void
  setFolderPathString: (path: string) => void
  setRootFolderForString: (path: string | null) => void
  resetCreateFolderForm: () => void
}

const initialState = {
  viewMode: "tree" as const,
  currentPage: 1,
  selectedImages: new Set<string>(),
  selectedFolder: null as string | null,
  openFolders: new Set<string>(),
  openFolderPaths: new Set<string>(),
  openFolderPathsUpload: new Set<string>(),
  openFolderPathsString: new Set<string>(),
  folderTreeSelectOpen: false,
  folderTreeSelectOpenUpload: false,
  folderTreeSelectOpenString: false,
  showCreateFolderForm: false,
  folderInputMode: "tree" as const,
  newFolderName: "",
  parentFolderForCreate: null as string | null,
  folderPathString: "",
  rootFolderForString: null as string | null,
}

export const useUploadsStore = create<UploadsUIState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        
        // View actions
        setViewMode: (mode) => set({ viewMode: mode }),
        setCurrentPage: (page) => set({ currentPage: page }),
        
        // Selection actions
        setSelectedImages: (images) =>
          set((state) => ({
            selectedImages: typeof images === "function" ? images(state.selectedImages) : images,
          })),
        setSelectedFolder: (folder) => set({ selectedFolder: folder }),
        toggleImageSelection: (fileName) =>
          set((state) => {
            const newSet = new Set(state.selectedImages)
            if (newSet.has(fileName)) {
              newSet.delete(fileName)
            } else {
              newSet.add(fileName)
            }
            return { selectedImages: newSet }
          }),
        selectAllImages: (images) =>
          set({
            selectedImages: new Set(images.map((img) => img.fileName)),
          }),
        clearSelection: () => set({ selectedImages: new Set() }),
        
        // Folder tree actions
        setOpenFolders: (folders) =>
          set((state) => ({
            openFolders: typeof folders === "function" ? folders(state.openFolders) : folders,
          })),
        toggleFolder: (path) =>
          set((state) => {
            const newSet = new Set(state.openFolders)
            if (newSet.has(path)) {
              newSet.delete(path)
            } else {
              newSet.add(path)
            }
            return { openFolders: newSet }
          }),
        setOpenFolderPaths: (paths) =>
          set((state) => ({
            openFolderPaths: typeof paths === "function" ? paths(state.openFolderPaths) : paths,
          })),
        setOpenFolderPathsUpload: (paths) =>
          set((state) => ({
            openFolderPathsUpload: typeof paths === "function" ? paths(state.openFolderPathsUpload) : paths,
          })),
        setOpenFolderPathsString: (paths) =>
          set((state) => ({
            openFolderPathsString: typeof paths === "function" ? paths(state.openFolderPathsString) : paths,
          })),
        
        // Popover actions
        setFolderTreeSelectOpen: (open) => set({ folderTreeSelectOpen: open }),
        setFolderTreeSelectOpenUpload: (open) => set({ folderTreeSelectOpenUpload: open }),
        setFolderTreeSelectOpenString: (open) => set({ folderTreeSelectOpenString: open }),
        
        // Create folder form actions
        setShowCreateFolderForm: (show) => set({ showCreateFolderForm: show }),
        setFolderInputMode: (mode) => set({ folderInputMode: mode }),
        setNewFolderName: (name) => set({ newFolderName: name }),
        setParentFolderForCreate: (path) => set({ parentFolderForCreate: path }),
        setFolderPathString: (path) => set({ folderPathString: path }),
        setRootFolderForString: (path) => set({ rootFolderForString: path }),
        resetCreateFolderForm: () =>
          set({
            newFolderName: "",
            parentFolderForCreate: null,
            folderPathString: "",
            rootFolderForString: null,
            folderInputMode: "tree",
          }),
      }),
      {
        name: "uploads-ui-store",
        // Chỉ persist một số state quan trọng
        partialize: (state) => ({
          viewMode: state.viewMode,
          selectedFolder: state.selectedFolder,
          // Không persist selection và open states vì chúng thay đổi thường xuyên
        }),
      }
    ),
    { name: "UploadsStore" }
  )
)

