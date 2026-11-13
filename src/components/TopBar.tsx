import React from 'react';
import {
  Undo2,
  Redo2,
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Columns2,
  FileEdit,
  Eye,
  Code2,
  Sun,
  Moon,
  PanelLeft,
  PanelRight,
} from 'lucide-react';
import type { DeviceViewport, WorkspaceViewMode } from '../types/document';

interface TopBarProps {
  documentTitle: string;
  onRenameDocument: (title: string) => void;
  saveLabel: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  viewMode: WorkspaceViewMode;
  onChangeViewMode: (mode: WorkspaceViewMode) => void;
  deviceViewport: DeviceViewport;
  onChangeDeviceViewport: (device: DeviceViewport) => void;
  appTheme: 'light' | 'dark';
  onToggleAppTheme: () => void;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  onOpenCodeGenerator: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  documentTitle,
  onRenameDocument,
  saveLabel,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  viewMode,
  onChangeViewMode,
  deviceViewport,
  onChangeDeviceViewport,
  appTheme,
  onToggleAppTheme,
  leftSidebarOpen,
  rightSidebarOpen,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  onOpenCodeGenerator,
}) => {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-4 dark:border-slate-800 dark:bg-slate-900">
      {/* Left Zone: Brand + Sidebar toggle + Document Title */}
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleLeftSidebar}
          aria-label={leftSidebarOpen ? 'Collapse left sidebar' : 'Open left sidebar'}
          aria-expanded={leftSidebarOpen}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-slate-600 transition-colors dark:text-slate-300 ${
            leftSidebarOpen
              ? 'border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'
              : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <span className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 dark:text-white">
          FolioDraft
        </span>

        <span className="hidden text-slate-300 sm:inline dark:text-slate-700" aria-hidden="true">
          /
        </span>

        <div className="hidden min-w-0 items-center gap-2 sm:flex">
          <input
            type="text"
            aria-label="Document title"
            value={documentTitle}
            onChange={(e) => onRenameDocument(e.target.value)}
            className="w-44 truncate rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-slate-800 hover:border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none lg:w-56 dark:text-slate-200 dark:hover:border-slate-700 dark:focus:bg-slate-950"
          />
          <span className="hidden text-xs text-slate-400 whitespace-nowrap xl:inline dark:text-slate-500">
            {saveLabel}
          </span>
        </div>
      </div>

      {/* Center Zone: Undo/Redo, View Mode, Device Preview */}
      <div className="hidden items-center gap-2 lg:flex">
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 dark:border-slate-800">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-35 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo (Ctrl+Y)"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-35 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        {/* Workspace View Mode */}
        <div
          className="flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800"
          role="group"
          aria-label="Workspace view mode"
        >
          <button
            type="button"
            onClick={() => onChangeViewMode('editor')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              viewMode === 'editor'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileEdit className="h-3.5 w-3.5" />
            Editor
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('split')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              viewMode === 'split'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" />
            Split
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('preview')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              viewMode === 'preview'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>

        {/* Device Preview Switcher */}
        {viewMode !== 'editor' && (
          <div
            className="flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800"
            role="group"
            aria-label="Preview device size"
          >
            <button
              type="button"
              onClick={() => onChangeDeviceViewport('desktop')}
              aria-label="Desktop preview"
              title="Desktop preview"
              className={`rounded-md p-1.5 transition-colors ${
                deviceViewport === 'desktop'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChangeDeviceViewport('laptop')}
              aria-label="Laptop preview"
              title="Laptop preview (1280px)"
              className={`rounded-md p-1.5 transition-colors ${
                deviceViewport === 'laptop'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Laptop className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChangeDeviceViewport('tablet')}
              aria-label="Tablet preview"
              title="Tablet preview (768px)"
              className={`rounded-md p-1.5 transition-colors ${
                deviceViewport === 'tablet'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Tablet className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChangeDeviceViewport('mobile')}
              aria-label="Mobile preview"
              title="Mobile preview (390px)"
              className={`rounded-md p-1.5 transition-colors ${
                deviceViewport === 'mobile'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Right Zone: App Theme + Primary CTA + Right Sidebar Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleAppTheme}
          aria-label={appTheme === 'dark' ? 'Switch workspace to light mode' : 'Switch workspace to dark mode'}
          title={appTheme === 'dark' ? 'Light workspace' : 'Dark workspace'}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {appTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={onOpenCodeGenerator}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 sm:px-3.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0"
        >
          <Code2 className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Generate Website Code</span>
          <span className="sm:hidden">Generate Code</span>
        </button>

        <button
          type="button"
          onClick={onToggleRightSidebar}
          aria-label={rightSidebarOpen ? 'Collapse design sidebar' : 'Open design sidebar'}
          aria-expanded={rightSidebarOpen}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-slate-600 transition-colors dark:text-slate-300 ${
            rightSidebarOpen
              ? 'border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'
              : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PanelRight className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
