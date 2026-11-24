'use client';

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BackgroundRippleProps {
  rows?: number;
  cols?: number;
  className?: string;
  cellClassName?: string;
  activeColor?: string;
  defaultColor?: string;
}

export const BackgroundRippleEffect = ({
  rows = 12,
  cols = 75,
  className,
  cellClassName,
  activeColor = "bg-accent/80 shadow-[0_0_15px_rgba(180,83,9,0.5)] dark:shadow-[0_0_15px_rgba(229,169,60,0.5)]",
  defaultColor = "bg-amber-200/60 border border-amber-300/40 dark:bg-zinc-800/60 dark:border-zinc-700/40",
}: BackgroundRippleProps) => {
  const [clickedCell, setClickedCell] = useState<{
    row: number;
    col: number;
    id: number;
  } | null>(null);

  const grid = useMemo(() => {
    return Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({ row: r, col: c }))
    );
  }, [rows, cols]);

  const handleCellClickOrHover = (row: number, col: number) => {
    setClickedCell({ row, col, id: Date.now() });
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden py-2 select-none",
        className
      )}
    >
      {grid.map((row, rIdx) => (
        <div key={rIdx} className="flex justify-center">
          {row.map((cell, cIdx) => {
            // Calculate Euclidean distance from the origin trigger point
            const distance = clickedCell
              ? Math.hypot(cell.row - clickedCell.row, cell.col - clickedCell.col)
              : null;

            const isTriggered =
              clickedCell?.row === cell.row && clickedCell?.col === cell.col;

            return (
              <motion.div
                key={`${rIdx}-${cIdx}`}
                onMouseEnter={() => handleCellClickOrHover(cell.row, cell.col)}
                onClick={() => handleCellClickOrHover(cell.row, cell.col)}
                animate={
                  distance !== null
                    ? {
                        scale: [1, 1.45, 1],
                        opacity: [1, 0.35, 1],
                        transition: {
                          delay: distance * 0.045, // Ripple propagation speed
                          duration: 0.45,
                          ease: "easeInOut",
                        },
                      }
                    : {}
                }
                className={cn(
                  "m-[1.5px] h-4 w-1.5 shrink-0 cursor-pointer rounded-full transition-colors duration-200",
                  isTriggered ? activeColor : defaultColor,
                  "hover:bg-accent hover:scale-125",
                  cellClassName
                )}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};
