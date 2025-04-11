import React, { useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card as CardType } from '../lib/game/cards';
import Card from './Card';

interface DraggableHandProps {
  cards: CardType[];
  onCardClick: (index: number) => void;
  onDragEnd: (result: DropResult) => void;
  canPlayCards?: boolean;
  title?: string;
  isQueue?: boolean; // Special layout for the queue of cards
}

const DraggableHand: React.FC<DraggableHandProps> = ({
  cards,
  onCardClick,
  onDragEnd,
  canPlayCards = true,
  title,
  isQueue = false
}) => {
  // Add state to track currently dragging item
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  
  // Container ref for calculating positions
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle drag start and end events
  const handleDragStart = (start: any) => {
    setIsDragging(true);
    setDraggedItemIndex(start.source.index);
  };
  
  const handleDragEndWithState = (result: DropResult) => {
    setIsDragging(false);
    setDraggedItemIndex(null);
    setDropTargetIndex(null);
    onDragEnd(result); // Call the original handler
  };
  
  const handleDragUpdate = (update: any) => {
    if (update.destination) {
      setDropTargetIndex(update.destination.index);
    } else {
      setDropTargetIndex(null);
    }
  };
  
  // Calculate a scale factor for cards when there are many in the queue
  const getCardScale = (totalCards: number, index: number) => {
    // No scaling needed for small number of cards
    if (totalCards <= 7) return 1;
    
    // Progressive scaling based on number of cards
    // The more cards we have, the smaller they get
    if (totalCards <= 9) return 0.95;
    if (totalCards <= 11) return 0.9;
    if (totalCards <= 13) return 0.85;
    return 0.8; // Minimum size for 14+ cards
  };
  
  // Calculate card overlap for queue mode
  const getCardOffset = (totalCards: number, index: number) => {
    // No offset needed for small number of cards (easier to drag)
    if (totalCards <= 7) return 0;
    
    // Progressive overlapping based on total cards
    if (totalCards <= 9) return `-${15}px`;
    if (totalCards <= 11) return `-${25}px`;
    if (totalCards <= 13) return `-${35}px`;
    return `-${45}px`; // Maximum overlap for 14+ cards
  };
  
  // Function to render the card list with proper dropTarget gap
  const renderCardList = () => {
    // Create a copy of cards array that we'll modify
    const displayCards = [...cards];
    
    // Map through cards and render them
    return displayCards.map((card, index) => {
      // Special case - this is the card being dragged
      const isCurrentlyDragged = isDragging && draggedItemIndex === index;
      
      // Special case - this is the position where we'll insert the dragged card
      const isDropTarget = isDragging && dropTargetIndex === index && draggedItemIndex !== index;
      
      // For the drop target position, render a gap indicator
      if (isDropTarget) {
        return (
          <div 
            key={`gap-${index}`}
            className="w-4 h-full min-h-[140px] flex-shrink-0 bg-cyan-500/20 rounded border-l-2 border-r-2 border-cyan-500 animate-pulse z-10 my-1"
            aria-hidden="true"
          />
        );
      }
      
      // Skip the card being dragged entirely from the DOM
      if (isCurrentlyDragged) {
        return null;
      }
      
      // Standard card rendering
      return (
        <Draggable 
          key={`${card.id}-${index}`} 
          draggableId={`${card.id}-${index}`} 
          index={index}
          isDragDisabled={!canPlayCards}
        >
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className={`
                transition-all duration-150 
                ${snapshot.isDragging ? 'z-50 brightness-125 shadow-lg shadow-cyan-500/50' : 
                  isQueue ? 'hover:z-50 hover:brightness-110 hover:shadow-lg hover:shadow-cyan-900/50' : 'hover:scale-105'} 
                relative
                ${isQueue ? 'first:ml-0' : ''}
              `}
              style={{ 
                ...provided.draggableProps.style,
                transform: snapshot.isDragging 
                  ? `${provided.draggableProps.style?.transform} scale(1.05)` 
                  : `${provided.draggableProps.style?.transform} scale(${getCardScale(cards.length, index)})`,
                marginLeft: isQueue && index > 0 && !isDragging ? getCardOffset(cards.length, index) : undefined,
                zIndex: snapshot.isDragging ? 100 : isQueue ? cards.length - index : undefined,
                transition: 'transform 0.15s ease-out, margin 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              {/* Execution order indicator for queue */}
              {isQueue && (
                <div className={`
                  absolute -top-2 -left-2 bg-cyan-500 text-white 
                  rounded-full w-6 h-6 flex items-center justify-center 
                  text-xs font-bold z-10 border-2 border-gray-800 
                  ${snapshot.isDragging ? 'animate-pulse' : ''}
                `}>
                  {/* Calculate correct execution number - account for drag repositioning */}
                  {isDragging && draggedItemIndex !== null && index >= draggedItemIndex 
                    ? index
                    : index + 1}
                </div>
              )}
              <Card 
                card={card}
                onClick={() => onCardClick(index)}
                disabled={!canPlayCards || isDragging}
              />
            </div>
          )}
        </Draggable>
      );
    });
  };

  return (
    <div>
      {title && <div className="text-gray-400 text-sm mb-2">{title}</div>}
      
      <DragDropContext 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEndWithState}
        onDragUpdate={handleDragUpdate}
      >
        <Droppable 
          droppableId="cards" 
          direction="horizontal"
          renderClone={(provided, snapshot, rubric) => (
            <div
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              ref={provided.innerRef}
              style={{
                ...provided.draggableProps.style,
                transform: `${provided.draggableProps.style?.transform} scale(1.05)`,
                boxShadow: '0 10px 25px -5px rgba(8, 145, 178, 0.5)'
              }}
              className="z-50 brightness-125 relative"
            >
              {/* Visual feedback for the dragged item */}
              <div className="absolute inset-0 border-2 border-cyan-500 rounded-md bg-cyan-500/10 z-0"></div>
              
              {/* Execution order indicator */}
              {isQueue && (
                <div className="absolute -top-2 -left-2 bg-cyan-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10 border-2 border-gray-800 animate-pulse">
                  {dropTargetIndex !== null 
                    ? dropTargetIndex + 1 // Show where it will go
                    : rubric.source.index + 1} {/* Default to original position */}
                </div>
              )}
              
              <Card 
                card={cards[rubric.source.index]}
                onClick={() => {}} // Disabled during drag
                disabled={true}
              />
            </div>
          )}
        >
          {(provided, snapshot) => (
            <div 
              className={`flex flex-row ${isQueue ? 'overflow-x-auto py-2 w-full flex-nowrap' : 'flex-wrap'} 
                        ${isDragging ? 'gap-2' : 'gap-2'} 
                        ${isQueue ? 'min-h-[140px]' : 'min-h-[140px]'}
                        ${snapshot.isDraggingOver ? 'bg-gray-800/20 rounded-lg' : ''}`}
              {...provided.droppableProps}
              ref={(el) => {
                // Satisfy both refs
                provided.innerRef(el);
                if (containerRef) {
                  // @ts-ignore - This is fine for our purposes
                  containerRef.current = el;
                }
              }}
            >
              {renderCardList()}
              {/* The placeholder is critical for the library to work correctly */}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      {cards.length === 0 && (
        <div className="text-gray-500 italic text-sm">No cards</div>
      )}
    </div>
  );
};

export default DraggableHand;