import React from 'react';
import { PATTERN_META, TextSegment } from '../data/types';
import { splitInlineTokens } from '../utils/readerLogic';

interface ColoredTextRendererProps {
  segments: TextSegment[];
  layout?: 'continuous' | 'blocks';
  paragraphId: string;
}

export const ColoredTextRenderer: React.FC<ColoredTextRendererProps> = ({
  segments,
  layout = 'continuous',
  paragraphId,
}) => {
  if (segments.length === 0) {
    return null;
  }

  if (layout === 'continuous') {
    return (
      <div className="font-matn-majalla text-[19px] sm:text-[21px] leading-[2.15] text-[#1f1a14] dark:text-[#eee7d7] space-y-2">
        <p className="leading-[2.25]">
          {segments.map((seg, sIdx) => {
            const meta = PATTERN_META[seg.type];
            const tokens = splitInlineTokens(seg);

            return (
              <React.Fragment key={`${paragraphId}-cont-${sIdx}`}>
                <span
                  className={`inline box-decoration-clone px-1.5 py-0.5 rounded-[4px] border-b border-black/10 dark:border-white/10 ${meta.inlineWordClass}`}
                >
                  <span className="font-heading-tajawal text-[11px] font-bold tracking-normal opacity-80 ml-1.5 select-none">
                    [{meta.shortTag}]
                  </span>
                  {tokens.map((tok, tIdx) => {
                    const tokMeta = PATTERN_META[tok.pattern];
                    if (tok.isQuranic) {
                      return (
                        <span
                          key={`${paragraphId}-tok-${sIdx}-${tIdx}`}
                          className={`font-quran-hafs text-[20px] sm:text-[22px] px-1 mx-0.5 rounded ${tokMeta.inlineWordClass}`}
                        >
                          {tok.text}
                        </span>
                      );
                    }
                    return (
                      <span key={`${paragraphId}-tok-${sIdx}-${tIdx}`}>
                        {tok.text}
                      </span>
                    );
                  })}
                  {seg.footnoteNum && (
                    <sup className="font-heading-tajawal text-[11px] font-bold text-[#1b4d3e] dark:text-[#7ec9ad] mr-1 select-none">
                      {seg.footnoteNum}
                    </sup>
                  )}
                </span>{' '}
              </React.Fragment>
            );
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {segments.map((seg, sIdx) => {
        const meta = PATTERN_META[seg.type];
        const tokens = splitInlineTokens(seg);

        return (
          <div
            key={`${paragraphId}-blk-${sIdx}`}
            className={`rounded-lg border p-4 sm:p-5 space-y-2 ${meta.segmentClass}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-heading-tajawal">
              <div className="flex items-center gap-2">
                {seg.footnoteNum && (
                  <span className="font-bold text-[#1b4d3e] dark:text-[#7ec9ad] tabular-nums">
                    {seg.footnoteNum}
                  </span>
                )}
                <span className="font-bold">[{meta.label}]</span>
              </div>
              {seg.ref && (
                <span className="opacity-80 tabular-nums">{seg.ref}</span>
              )}
            </div>

            <p
              className={
                seg.type === 'quran'
                  ? 'font-quran-hafs text-[21px] sm:text-[23px] leading-[2.15]'
                  : 'font-matn-majalla text-[18px] sm:text-[20px] leading-[2.05]'
              }
            >
              {tokens.map((tok, tIdx) => {
                if (tok.isQuranic && seg.type !== 'quran') {
                  const qMeta = PATTERN_META.quran;
                  return (
                    <span
                      key={`${paragraphId}-btok-${sIdx}-${tIdx}`}
                      className={`font-quran-hafs text-[20px] sm:text-[22px] px-1.5 py-0.5 rounded mx-0.5 ${qMeta.inlineWordClass}`}
                    >
                      {tok.text}
                    </span>
                  );
                }
                return (
                  <span key={`${paragraphId}-btok-${sIdx}-${tIdx}`}>
                    {tok.text}
                  </span>
                );
              })}
            </p>
          </div>
        );
      })}
    </div>
  );
};
