import * as React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type { DropResult } from 'react-beautiful-dnd';
import type { ProductImage, ProductVariant } from './ProductDetailImages.types';
import { Box, Chip, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

type ImagesGridProps = {
  images: ProductImage[];
  variants: ProductVariant[];
  onDelete: (id: string) => void;
  onSetThumbnail: (id: string) => void;
  onAssociateVariant: (imageId: string, variantId: string) => void;
  onDisassociateVariant: (imageId: string, variantId: string) => void;
  onReorder: (newImages: ProductImage[]) => void;
};

export const ImagesGrid: React.FC<ImagesGridProps> = ({
  images,
  variants,
  onDelete,
  onSetThumbnail,
  onAssociateVariant,
  onDisassociateVariant,
  onReorder,
}: ImagesGridProps) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(images);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    onReorder(reordered);
  };
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="images-grid" direction="horizontal">
        {(provided) => (
          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fill, minmax(160px, 1fr))"
            gap={2}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {images.map((img: ProductImage, idx: number) => (
              <Draggable key={img.id} draggableId={img.id} index={idx}>
                {(dragProvided, dragSnapshot) => (
                  <Box
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    borderRadius={2}
                    boxShadow={dragSnapshot.isDragging ? 6 : 2}
                    p={1}
                    bgcolor="#fff"
                    position="relative"
                    style={{
                      ...dragProvided.draggableProps.style,
                      opacity: dragSnapshot.isDragging ? 0.7 : 1,
                    }}
                  >
                    <img src={img.url} alt="Imagen producto" style={{ width: '100%', borderRadius: 8, objectFit: 'cover', aspectRatio: '1/1' }} />
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                      <IconButton size="small" color={img.isThumbnail ? 'primary' : 'default'} onClick={() => onSetThumbnail(img.id)}>
                        {img.isThumbnail ? <StarIcon /> : <StarBorderIcon />}
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => onDelete(img.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Box mt={1} display="flex" flexWrap="wrap" gap={0.5}>
                      {variants.map((variant: ProductVariant) => (
                        img.variantIds.includes(variant.id) ? (
                          <Chip
                            key={variant.id}
                            label={variant.name}
                            size="small"
                            color="primary"
                            onDelete={() => onDisassociateVariant(img.id, variant.id)}
                          />
                        ) : (
                          <Chip
                            key={variant.id}
                            label={variant.name}
                            size="small"
                            variant="outlined"
                            onClick={() => onAssociateVariant(img.id, variant.id)}
                          />
                        )
                      ))}
                    </Box>
                  </Box>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  );
};
