import React, { useRef } from 'react';
import { Box, Button } from '@mui/material';

interface ImageUploadProps {
  onUpload: (files: FileList) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onUpload(e.target.files);
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={2}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Button variant="contained" onClick={() => inputRef.current?.click()}>
        Subir imágenes
      </Button>
      <span>o arrastra aquí</span>
    </Box>
  );
};
