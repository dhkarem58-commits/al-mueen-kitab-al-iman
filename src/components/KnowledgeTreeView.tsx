import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  GitBranch,
  HelpCircle,
} from 'lucide-react';
import { KnowledgeTreeData, PATTERN_META, TreeNode } from '../data/types';
import { collectTreeNodeIds, findTreeNode } from '../utils/readerLogic';

interface KnowledgeTreeViewProps {
  trees: KnowledgeTreeData[];
  selectedTreeId: string;
  onSelectTree: (treeId: string) => void;
  onOpenSectionReader: (sectionId: string) => void;
  onOpenSectionQuestions: (sectionId: string) => void;
  onOpenPdfAtPage: (page: number) => void;
}

export const KnowledgeTreeView: React.FC<KnowledgeTreeViewProps> = ({
  trees,
  selectedTreeId,
  onSelectTree,
  onOpenSectionReader,
  onOpenSectionQuestions,
  onOpenPdfAtPage,
}) => {
  const activeTree = trees.find((t) => t.id === selectedTreeId) ?? trees[0];
  const [selectedNodeId, setSelectedNodeId] = useState<string>(activeTree.root.id);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    setSelectedNodeId(activeTree.root.id);
    setCollapsedIds(new Set());
  }, [activeTree.id, activeTree.root.id]);

  const selectedNode =
    findTreeNode(activeTree.root, selectedNodeId) ?? activeTree.root;

  const toggleCollapse = (nodeId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => setCollapsedIds(new Set());
  const collapseAll = () => {
    const all = collectTreeNodeIds(activeTree.root).filter(
      (id) => id !== activeTree.root.id
    );
    setCollapsedIds(new Set(all));
  };

  const renderTreeNode = (node: TreeNode, depth = 0): React.ReactNode => {
    const meta = PATTERN_META[node.pattern];
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = !collapsedIds.has(node.id);
    const isSelected = selectedNode.id === node.id;

    return (
      <div key={node.id} className={depth > 0 ? 'mt-3 pr-4 sm:pr-6' : ''}>
        <div
          className={`rounded-xl border transition-all ${
            isSelected
              ? 'ring-2 ring-[#1b4d3e]/70 dark:ring-[#7ec9ad]/70 shadow-xs'
              : ''
          } ${meta.segmentClass}`}
        >
          <div className="p-3.5 sm:p-4 flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => setSelectedNodeId(node.id)}
              className="flex-1 text-right space-y-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1b4d3e] rounded"
            >
              <div className="flex flex-wrap items-center gap-2 font-heading-tajawal text-[11px] opacity-85 tabular-nums">
                <span className="font-bold">[{meta.label}]</span>
                <span aria-hidden="true">·</span>
                <span>{node.author}</span>
                <span aria-hidden="true">·</span>
                <span>ص {node.pageRef}</span>
              </div>
              <div className="font-heading-tajawal text-sm sm:text-base font-bold leading-snug">
                {node.title}
              </div>
              {node.subtitle && (
                <div className="font-matn-majalla text-sm sm:text-base opacity-85">
                  {node.subtitle}
                </div>
              )}
            </button>

            {hasChildren && (
              <button
                type="button"
                onClick={() => toggleCollapse(node.id)}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? `طي فرع ${node.title}` : `توسيع فرع ${node.title}`}
                className="p-1.5 rounded-lg border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 shrink-0 cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-r border-dashed border-[#cfc2a9] dark:border-[#3b332a] mr-4">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const selectedMeta = PATTERN_META[selectedNode.pattern];

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="paper-sheet rounded-xl p-4 sm:p-5 space-y-4 font-heading-tajawal">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-[#1b4d3e] dark:text-[#7ec9ad]" aria-hidden="true" />
            <h1 className="text-lg sm:text-xl font-bold text-[#1f1a14] dark:text-[#eee7d7]">
              التشجيرات العلمية الشاملة لمسائل الكتاب
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#cfc2a9] dark:border-[#43392e] text-[#1f1a14] dark:text-[#eee7d7] hover:bg-[#efe6d3] dark:hover:bg-[#27211b] cursor-pointer whitespace-nowrap"
            >
              توسيع الكل
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#cfc2a9] dark:border-[#43392e] text-[#1f1a14] dark:text-[#eee7d7] hover:bg-[#efe6d3] dark:hover:bg-[#27211b] cursor-pointer whitespace-nowrap"
            >
              طي الفروع
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {trees.map((tree) => {
            const active = tree.id === activeTree.id;
            return (
              <button
                key={tree.id}
                type="button"
                onClick={() => onSelectTree(tree.id)}
                className={`px-3 py-2 text-xs font-medium rounded-lg border text-right transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#1b4d3e] text-[#fcf9f1] border-[#1b4d3e] dark:bg-[#2a6e59] dark:border-[#2a6e59] font-bold'
                    : 'bg-[#f1ead9] dark:bg-[#171410] text-[#3d342a] dark:text-[#ccc0ac] border-[#d6cbb3] dark:border-[#3b332a] hover:bg-[#e6dcc6] dark:hover:bg-[#26201a]'
                }`}
              >
                {tree.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section
          aria-label="هيكل التشجير العلمي"
          className="lg:col-span-8 paper-stack rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <div className="border-b border-[#e5dcc8] dark:border-[#332c24] pb-4 space-y-1">
            <div className="font-heading-tajawal text-xs text-[#655b4e] dark:text-[#b0a491] tabular-nums">
              نطاق التشجير: {activeTree.pageRange}
            </div>
            <h2 className="font-heading-tajawal text-lg sm:text-xl font-bold text-[#1f1a14] dark:text-[#eee7d7]">
              {activeTree.title}
            </h2>
            <p className="font-matn-majalla text-base sm:text-lg text-[#564b3e] dark:text-[#c7baa5]">
              {activeTree.description}
            </p>
          </div>

          <div>{renderTreeNode(activeTree.root)}</div>
        </section>

        <aside
          aria-label="تفاصيل العنصر المختار"
          className="lg:col-span-4 lg:sticky lg:top-6 paper-sheet rounded-2xl p-5 space-y-5"
        >
          <div className="space-y-2 font-heading-tajawal">
            <div className="text-xs text-[#655b4e] dark:text-[#b0a491] tabular-nums">
              تفاصيل العقدة المختارة · {selectedNode.author} · ص {selectedNode.pageRef}
            </div>
            <div className={`inline-block px-2.5 py-1 text-xs font-bold rounded-md border ${selectedMeta.chipClass}`}>
              [{selectedMeta.label}]
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#1f1a14] dark:text-[#eee7d7] leading-snug pt-1">
              {selectedNode.title}
            </h3>
          </div>

          <p className="font-matn-majalla text-base sm:text-lg text-[#3d342a] dark:text-[#ccc0ac] leading-relaxed paper-hashiyah-sheet rounded-xl p-4">
            {selectedNode.details}
          </p>

          <div className="space-y-2.5 pt-2 border-t border-[#e5dcc8] dark:border-[#332c24] font-heading-tajawal">
            <button
              type="button"
              onClick={() => onOpenSectionReader(activeTree.sectionId)}
              className="w-full px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-[#1b4d3e] text-[#fcf9f1] hover:bg-[#143b2f] dark:bg-[#2a6e59] dark:hover:bg-[#33856b] transition-colors cursor-pointer"
            >
              قراءة الباب كاملاً في المذكرة
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onOpenPdfAtPage(selectedNode.pageRef)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#cfc2a9] dark:border-[#43392e] text-[#1f1a14] dark:text-[#eee7d7] hover:bg-[#efe6d3] dark:hover:bg-[#27211b] cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>ص {selectedNode.pageRef} PDF</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenSectionQuestions(activeTree.sectionId)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#cfc2a9] dark:border-[#43392e] text-[#1f1a14] dark:text-[#eee7d7] hover:bg-[#efe6d3] dark:hover:bg-[#27211b] cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>أسئلة هذا الباب</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
