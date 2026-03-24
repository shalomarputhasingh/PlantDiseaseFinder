"use client";

import { useRef, useState } from "react";

interface ImageUploadProps {
  onImageSelect: (base64: string, preview: string) => void;
  disabled?: boolean;
}

export default function ImageUpload({ onImageSelect, disabled = false }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFile(file: File) {
    if (!file || !file.type.startsWith("image/")) return;

    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onImageSelect(base64, previewUrl);
    };

    reader.readAsDataURL(file);
  }

  function handleClick() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset value so same file can be re-selected
    e.target.value = "";
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload a leaf image"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? "#7ab648" : "#d1d5db"}`,
        backgroundColor: isDragging ? "#f0fdf4" : "#ffffff",
        borderRadius: "0.75rem",
        minHeight: "200px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? "none" : "auto",
        transition: "border-color 0.2s, background-color 0.2s",
        padding: "1.5rem",
        userSelect: "none",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        style={{ display: "none" }}
        tabIndex={-1}
        aria-hidden="true"
      />

      <span
        style={{ fontSize: "3rem", lineHeight: 1 }}
        aria-hidden="true"
      >
        📸
      </span>

      <p
        style={{
          color: "#1a3c2b",
          fontWeight: 500,
          fontSize: "1rem",
          margin: 0,
          textAlign: "center",
        }}
      >
        Drop your leaf photo here
      </p>

      <p
        style={{
          color: "#6b7280",
          fontSize: "0.875rem",
          margin: 0,
          textAlign: "center",
        }}
      >
        or click to browse · JPG, PNG, WEBP
      </p>

      <p
        style={{
          color: "#6b7280",
          fontSize: "0.75rem",
          margin: 0,
          textAlign: "center",
          marginTop: "0.25rem",
        }}
      >
        💡 Good lighting · Clear leaf · No blurry photos
      </p>
    </div>
  );
}
