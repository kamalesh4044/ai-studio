import type { ReactNode } from "react";
import { useDropzone, type Accept } from "react-dropzone";

interface ImageUploaderProps {
  onUpload: (files: File[]) => void;
  accept?: Accept;
  multiple?: boolean;
  children: ReactNode;
}

export default function ImageUploader({
  onUpload,
  accept,
  multiple = true,
  children
}: ImageUploaderProps) {
  const { getRootProps, getInputProps } = useDropzone({
    accept,
    multiple,
    noClick: false,
    noKeyboard: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles);
      }
    }
  });

  return (
    <div {...getRootProps({ className: "inline-flex" })}>
      <input {...getInputProps()} />
      {children}
    </div>
  );
}
