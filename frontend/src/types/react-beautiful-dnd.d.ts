declare module 'react-beautiful-dnd' {
  import React from 'react';

  export interface DragStart {
    draggableId: string;
    type: string;
    source: {
      index: number;
      droppableId: string;
    };
  }

  export interface DragUpdate extends DragStart {
    combine?: any;
    destination?: {
      droppableId: string;
      index: number;
    };
  }

  export interface DropResult {
    draggableId: string;
    type: string;
    source: {
      index: number;
      droppableId: string;
    };
    destination?: {
      droppableId: string;
      index: number;
    };
    combine?: any;
    reason: 'DROP' | 'CANCEL';
  }

  export interface DragContextProps {
    onDragStart?: (initial: DragStart) => void;
    onDragUpdate?: (update: DragUpdate) => void;
    onDragEnd: (result: DropResult) => void;
    children: React.ReactNode;
  }

  export const DragDropContext: React.FC<DragContextProps>;

  export interface DroppableProps {
    droppableId: string;
    type?: string;
    isDropDisabled?: boolean;
    isCombineEnabled?: boolean;
    children: (provided: any, snapshot: any) => React.ReactElement;
  }

  export const Droppable: React.FC<DroppableProps>;

  export interface DraggableProps {
    draggableId: string;
    index: number;
    isDragDisabled?: boolean;
    children: (provided: any, snapshot: any) => React.ReactElement;
  }

  export const Draggable: React.FC<DraggableProps>;
}
