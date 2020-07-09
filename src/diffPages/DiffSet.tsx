import React from "react";
import { DiffItem } from "../diff";

interface DiffSetProps {
  title: string;
  diff: DiffItem[];
}

export default function DiffSet({ title, diff }: DiffSetProps) {
  return (
    <div>
      <h2>{title}</h2>

      <ul>
        {diff.map((hash) => (
          <li key={hash}>{hash}</li>
        ))}
      </ul>
    </div>
  );
}
