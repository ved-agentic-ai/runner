'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Folder, 
  FileCode, 
  Key, 
  Trash2, 
  Calendar, 
  RefreshCw, 
  ChevronRight, 
  ChevronDown, 
  AlertTriangle, 
  FileText,
  ChevronsUp,
  ChevronsDown,
  CheckSquare,
  Square
} from 'lucide-react';
import { useUserAuthStore } from '@/lib/user-auth-store';
import { useAdminStore } from '@/lib/admin-store';
import { useRunnerStore } from '@/lib/store';
import { parsePostmanCollection } from '@/lib/postman-parser';
import { TreeNode } from '@/lib/types';

interface UserWorkspaceSidebarProps {
  onLoadFileToWorkspace: (file: any) => void;
  refreshTrigger?: number;
}

export const UserWorkspaceSidebar: React.FC<UserWorkspaceSidebarProps> = ({
  onLoadFileToWorkspace,
  refreshTrigger
}) => {
  const { user, isAuthenticated } = useUserAuthStore();
  const { serverStoragePaused } = useAdminStore();
  const setSelectedEndpointIdForDetail = useRunnerStore((s) => s.setSelectedEndpointIdForDetail);

  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [collectionsExpanded, setCollectionsExpanded] = useState(true);
  const [envExpanded, setEnvExpanded] = useState(true);
  const [loadedFileId, setLoadedFileId] = useState<string | null>(null);

  // Expanded collection tree preview states in sidebar
  const [expandedFileTreeIds, setExpandedFileTreeIds] = useState<Record<string, boolean>>({});
  // Per-file subfolder expansion state
  const [expandedSubfolders, setExpandedSubfolders] = useState<Record<string, boolean>>({});
  // Per-file selection state
  const [selectedSidebarNodeIds, setSelectedSidebarNodeIds] = useState<Record<string, Set<string>>>({});

  // Custom Delete Modal State
  const [fileToDelete, setFileToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUserFiles = async () => {
    if (!isAuthenticated || !user) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/user/files?userId=${user.id}`);
      const data = await res.json();
      setLoading(false);
      if (data.success && data.files) {
        setFiles(data.files);
      }
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserFiles();
  }, [user?.id, isAuthenticated, refreshTrigger]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const collections = files.filter((f) => f.fileType === 'collection');
  const envFiles = files.filter((f) => f.fileType === 'env');

  const confirmDeleteFile = async () => {
    if (!fileToDelete || !user) return;
    setDeleting(true);
    try {
      await fetch(`/api/user/files?fileId=${fileToDelete.id}&userId=${user.id}`, { method: 'DELETE' });
      setDeleting(false);
      setFileToDelete(null);
      fetchUserFiles();
    } catch (err) {
      setDeleting(false);
    }
  };

  const toggleSidebarFileTree = (fileId: string) => {
    setExpandedFileTreeIds((prev) => ({ ...prev, [fileId]: !prev[fileId] }));
  };

  const toggleSubfolder = (folderId: string) => {
    setExpandedSubfolders((prev) => ({ ...prev, [folderId]: !(prev[folderId] ?? true) }));
  };

  // Helper to parse tree nodes for sidebar inline hierarchy
  function parseSidebarTreeNodes(content: string): { rootNodes: TreeNode[]; allNodeIds: string[]; totalEndpoints: number } {
    const allNodeIds: string[] = [];
    let totalEndpoints = 0;

    try {
      const parsed = JSON.parse(content);
      if (parsed.nodes && Array.isArray(parsed.nodes)) {
        function collect(nodes: any[]) {
          nodes.forEach((n) => {
            allNodeIds.push(n.id);
            if (n.type === 'endpoint') totalEndpoints++;
            if (n.children) collect(n.children);
          });
        }
        collect(parsed.nodes);
        return { rootNodes: parsed.nodes, allNodeIds, totalEndpoints };
      }
      if (parsed.info || parsed.item) {
        const { rootNodes } = parsePostmanCollection(parsed);
        function collect(nodes: TreeNode[]) {
          nodes.forEach((n) => {
            allNodeIds.push(n.id);
            if (n.type === 'endpoint') totalEndpoints++;
            if (n.children) collect(n.children);
          });
        }
        collect(rootNodes);
        return { rootNodes, allNodeIds, totalEndpoints };
      }
    } catch (e) {}
    return { rootNodes: [], allNodeIds, totalEndpoints: 0 };
  }

  function toggleSidebarNodeSelection(fileId: string, nodeId: string, allIds: string[], subNodes?: TreeNode[]) {
    const currentSet = new Set(selectedSidebarNodeIds[fileId] || allIds);
    const shouldSelect = !currentSet.has(nodeId);

    function toggleSubtree(id: string, children?: TreeNode[]) {
      if (shouldSelect) currentSet.add(id);
      else currentSet.delete(id);

      if (Array.isArray(children)) {
        children.forEach((c) => toggleSubtree(c.id, c.children));
      }
    }

    toggleSubtree(nodeId, subNodes);
    setSelectedSidebarNodeIds((prev) => ({ ...prev, [fileId]: currentSet }));
  }

  function renderSidebarTree(fileId: string, nodes: TreeNode[], allNodeIds: string[], depth = 0) {
    if (!Array.isArray(nodes) || nodes.length === 0) return null;
    const fileSelectedSet = selectedSidebarNodeIds[fileId] || new Set(allNodeIds);

    return nodes.map((node, idx) => {
      const isFolder = node.type === 'folder' || (node.children && node.children.length > 0);
      const isExpanded = expandedSubfolders[node.id] ?? true;
      const isSelected = fileSelectedSet.has(node.id);

      return (
        <div key={node.id || idx} style={{ marginLeft: `${depth * 12}px` }} className="space-y-0.5 text-[10px] font-mono">
          <div className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-slate-800/80 cursor-pointer select-none group">
            <div className="flex items-center space-x-1.5 min-w-0">
              {/* Subfolder Collapse Arrow */}
              {isFolder ? (
                <button type="button" onClick={() => toggleSubfolder(node.id)} className="text-amber-400 p-0.5 hover:text-white shrink-0">
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
              ) : (
                <span className="w-3 shrink-0" />
              )}

              {/* Checkbox */}
              <button 
                type="button" 
                onClick={() => toggleSidebarNodeSelection(fileId, node.id, allNodeIds, node.children)}
                className="text-indigo-400 shrink-0"
              >
                {isSelected ? <CheckSquare className="h-3.5 w-3.5 text-emerald-400" /> : <Square className="h-3.5 w-3.5 text-slate-600" />}
              </button>

              {/* Icon */}
              {isFolder ? (
                <Folder className="h-3 w-3 text-amber-400 shrink-0" />
              ) : (
                <FileText className="h-3 w-3 text-emerald-400 shrink-0" />
              )}

              {/* Node Name (Click Endpoint to Inspect Details) */}
              <span 
                onClick={() => isFolder ? toggleSubfolder(node.id) : setSelectedEndpointIdForDetail(node.id)}
                className={`truncate ${isSelected ? 'text-slate-200 font-bold group-hover:text-indigo-300' : 'text-slate-500 line-through'}`}
                title={node.name}
              >
                {node.name}
              </span>
            </div>

            {/* Method Badge */}
            {node.method && (
              <span className={`px-1 py-0.2 rounded text-[8px] font-bold shrink-0 ml-1 ${
                node.method === 'GET' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                node.method === 'POST' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
                node.method === 'DELETE' ? 'bg-red-950 text-red-400 border border-red-800' :
                'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                {node.method}
              </span>
            )}
          </div>

          {isFolder && isExpanded && node.children && renderSidebarTree(fileId, node.children, allNodeIds, depth + 1)}
        </div>
      );
    });
  }

  return (
    <div className="w-full lg:w-80 shrink-0 rounded-3xl border border-slate-800 bg-slate-950 p-4 space-y-4 shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Folder className="h-4 w-4 text-indigo-400" />
          <h3 className="font-bold text-xs text-white">Server Workspace Explorer</h3>
        </div>
        <button
          onClick={fetchUserFiles}
          className="p-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-all"
          title="Refresh server files"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* EMERGENCY STORAGE PAUSE NOTICE BANNER */}
      {serverStoragePaused && (
        <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-3 space-y-1 text-left animate-in fade-in">
          <span className="font-bold text-red-300 text-[11px] block">⚠️ Server Storage Sync Paused</span>
          <p className="text-[10px] text-slate-300 leading-snug">
            Cloud workspace file saving is currently paused due to heavy server storage load. Please upgrade your SaaS plan to resume cloud sync.
          </p>
        </div>
      )}

      {/* TREE VIEW: API COLLECTIONS */}
      <div className="space-y-1">
        <div 
          onClick={() => setCollectionsExpanded(!collectionsExpanded)}
          className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:bg-slate-900"
        >
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300">
            {collectionsExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <FileCode className="h-4 w-4 text-indigo-400" />
            <span>API Collections ({collections.length})</span>
          </div>
        </div>

        {collectionsExpanded && (
          <div className="pl-1 space-y-2 pt-1">
            {collections.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic pl-3 py-1">No collections saved on server.</p>
            ) : (
              collections.map((f) => {
                const { rootNodes: sidebarTree, allNodeIds, totalEndpoints } = parseSidebarTreeNodes(f.content);
                const isTreeExpanded = expandedFileTreeIds[f.id] ?? false;
                const fileSelectedSet = selectedSidebarNodeIds[f.id] || new Set(allNodeIds);

                return (
                  <div 
                    key={f.id} 
                    className={`rounded-2xl border p-2.5 text-xs space-y-2 transition-all ${
                      loadedFileId === f.id ? 'border-emerald-800/80 bg-emerald-950/20' : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <button 
                          onClick={() => toggleSidebarFileTree(f.id)}
                          className="text-slate-400 hover:text-amber-400 p-0.5"
                          title={isTreeExpanded ? 'Collapse Tree Preview' : 'Expand Tree Preview'}
                        >
                          {isTreeExpanded ? <ChevronDown className="h-3.5 w-3.5 text-amber-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                        </button>
                        <span className="font-bold text-slate-200 truncate max-w-[140px]" title={f.fileName}>{f.fileName}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setFileToDelete({ id: f.id, name: f.fileName })}
                          className="text-slate-500 hover:text-red-400 p-1"
                          title="Delete File"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            onLoadFileToWorkspace(f);
                            setLoadedFileId(f.id);
                          }}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all shadow-sm ${
                            loadedFileId === f.id ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                          }`}
                        >
                          {loadedFileId === f.id ? 'Active' : 'Load'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1 text-[9px] text-slate-500">
                        <Calendar className="h-2.5 w-2.5" /> {new Date(f.updatedAt).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-300 font-bold">
                        {fileSelectedSet.size} / {allNodeIds.length} Nodes ({totalEndpoints} Endpoints)
                      </span>
                    </div>

                    {/* Inline Sidebar Full Tree Hierarchy Preview */}
                    {isTreeExpanded && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-2 animate-in fade-in">
                        {/* Control Toolbar (Collapse, Expand, Select All, None) */}
                        <div className="flex items-center justify-between px-2 py-1 bg-slate-950 rounded-xl border border-slate-800/80 text-[10px] font-mono">
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const next: Record<string, boolean> = {};
                                allNodeIds.forEach((id) => { next[id] = false; });
                                setExpandedSubfolders((prev) => ({ ...prev, ...next }));
                              }}
                              className="inline-flex items-center space-x-0.5 text-slate-400 hover:text-amber-400 font-medium"
                              title="Collapse All Subfolders"
                            >
                              <ChevronsUp className="h-3 w-3 text-amber-400" />
                              <span>Collapse</span>
                            </button>

                            <span className="text-slate-700">|</span>

                            <button
                              type="button"
                              onClick={() => {
                                const next: Record<string, boolean> = {};
                                allNodeIds.forEach((id) => { next[id] = true; });
                                setExpandedSubfolders((prev) => ({ ...prev, ...next }));
                              }}
                              className="inline-flex items-center space-x-0.5 text-slate-400 hover:text-indigo-400 font-medium"
                              title="Expand All Subfolders"
                            >
                              <ChevronsDown className="h-3 w-3 text-indigo-400" />
                              <span>Expand</span>
                            </button>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedSidebarNodeIds((prev) => ({ ...prev, [f.id]: new Set(allNodeIds) }))}
                              className="text-indigo-400 hover:underline font-bold"
                            >
                              All
                            </button>
                            <span className="text-slate-700">|</span>
                            <button
                              type="button"
                              onClick={() => setSelectedSidebarNodeIds((prev) => ({ ...prev, [f.id]: new Set() }))}
                              className="text-slate-400 hover:underline font-bold"
                            >
                              None
                            </button>
                          </div>
                        </div>

                        <div className="max-h-56 overflow-y-auto custom-scrollbar p-1.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                          {renderSidebarTree(f.id, sidebarTree, allNodeIds)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* TREE VIEW: ENVIRONMENT FILES */}
      <div className="space-y-1">
        <div 
          onClick={() => setEnvExpanded(!envExpanded)}
          className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:bg-slate-900"
        >
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
            {envExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Key className="h-4 w-4 text-amber-400" />
            <span>Environment Files ({envFiles.length})</span>
          </div>
        </div>

        {envExpanded && (
          <div className="pl-1 space-y-1.5 pt-1">
            {envFiles.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic pl-3 py-1">No .env files saved on server.</p>
            ) : (
              envFiles.map((f) => (
                <div 
                  key={f.id} 
                  className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-2 text-xs space-y-1 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 truncate max-w-[150px]">{f.fileName}</span>
                    <button
                      onClick={() => setFileToDelete({ id: f.id, name: f.fileName })}
                      className="text-slate-500 hover:text-red-400 p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1 text-[9px] text-slate-500">
                      <Calendar className="h-2.5 w-2.5" /> {new Date(f.updatedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => onLoadFileToWorkspace(f)}
                      className="px-2 py-0.5 rounded-lg font-bold text-[10px] bg-amber-600 text-white hover:bg-amber-500 transition-all"
                    >
                      Load Env
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* CONFIRMATION DELETE MODAL PORTAL */}
      {fileToDelete && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-red-900/50 bg-[#0f172a] p-5 shadow-2xl space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Delete Server File</h4>
                <p className="text-xs text-slate-400 truncate max-w-[180px]">{fileToDelete.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <code className="text-red-300 font-bold">{fileToDelete.name}</code> from your server storage?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setFileToDelete(null)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFile}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition-all disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete File'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
