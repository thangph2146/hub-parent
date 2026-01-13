import React from "react";

/**
 * Helper function để highlight "HUB" trong text với màu secondary
 */
export const highlightHUB = (text: string): React.ReactNode => {
  const parts = text.split(/(HUB)/gi);
  return parts.map((part, index) =>
    part.toUpperCase() === "HUB" ? (
      <span key={index} className="text-secondary font-bold text-lg sm:text-xl md:text-2xl">
        {part}
      </span>
    ) : (
      part
    )
  );
};
