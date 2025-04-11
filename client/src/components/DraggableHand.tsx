import React, { useState, useRef, useEffect } from 'react';
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
    // No scaling during drag operations for better UX
    if (isDragging) return 1;
    
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
    // No overlapping during drag operations
    if (isDragging) return 0;
    
    // No offset needed for small number of cards (easier to drag)
    if (totalCards <= 7) return 0;
    
    // Progressive overlapping based on total cards
    if (totalCards <= 9) return `-${15}px`;
    if (totalCards <= 11) return `-${25}px`;
    if (totalCards <= 13) return `-${35}px`;
    return `-${45}px`; // Maximum overlap for 14+ cards
  };
  
  // Function to determine if a gap should be shown before this card
  const shouldShowGapBefore = (index: number) => {
    if (!isDragging || draggedItemIndex === null || dropTargetIndex === null) return false;
    return index === dropTargetIndex && index !== draggedItemIndex;
  };
  
  // Function to determine if this card should be hidden (the one being dragged)
  const isHidden = (index: number) => {
    return isDragging && draggedItemIndex === index;
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
                  {rubric.source.index + 1}
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
                        ${isDragging ? 'gap-1' : 'gap-2'} 
                        ${isQueue ? 'min-h-[110px]' : 'min-h-[120px]'}
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
              {cards.map((card, index) => (
                <React.Fragment key={`fragment-${card.id}-${index}`}>
                  {shouldShowGapBefore(index) && (
                    <div 
                      className="w-4 h-full flex-shrink-0 bg-cyan-500/20 rounded border-l-2 border-r-2 border-cyan-500 animate-pulse"
                      aria-hidden="true"
                    />
                  )}
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
                          ${isHidden(index) ? 'opacity-20 pointer-events-none' : ''}
                        `}
                        style={{ 
                          ...provided.draggableProps.style,
                          transform: snapshot.isDragging 
                            ? `${provided.draggableProps.style?.transform} scale(1.05)` 
                            : `${provided.draggableProps.style?.transform} scale(${getCardScale(cards.length, index)})`,
                          marginLeft: isQueue && index > 0 ? getCardOffset(cards.length, index) : undefined,
                          zIndex: snapshot.isDragging ? 100 : isQueue ? cards.length - index : undefined,
                          transition: 'transform 0.15s ease-out, margin 0.15s ease-out, opacity 0.15s ease',
                        }}
                      >
                        {/* Execution order indicator for queue */}
                        {isQueue && !isHidden(index) && (
                          <div className={`
                            absolute -top-2 -left-2 bg-cyan-500 text-white 
                            rounded-full w-6 h-6 flex items-center justify-center 
                            text-xs font-bold z-10 border-2 border-gray-800 
                            ${snapshot.isDragging ? 'animate-pulse' : ''}
                          `}>
                            {index + 1}
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
                </React.Fragment>
              ))}
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