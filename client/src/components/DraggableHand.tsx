import React, { useState } from 'react';
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
  
  // Handle drag start and end events
  const handleDragStart = () => {
    setIsDragging(true);
  };
  
  const handleDragEndWithState = (result: DropResult) => {
    setIsDragging(false);
    onDragEnd(result); // Call the original handler
  };
  
  // Calculate a scale factor for cards when there are many in the queue
  const getCardScale = (totalCards: number, index: number) => {
    // No scaling needed for small number of cards
    if (totalCards <= 7) return 1;
    
    // When dragging, don't scale down cards for better visibility 
    if (isDragging) return 0.97;
    
    // Progressive scaling based on number of cards
    // The more cards we have, the smaller they get
    if (totalCards <= 9) return 0.95;
    if (totalCards <= 11) return 0.9;
    if (totalCards <= 13) return 0.85;
    return 0.8; // Minimum size for 14+ cards
  };
  
  // Calculate card overlap for queue mode
  const getCardOffset = (totalCards: number, index: number) => {
    // When dragging, we want no overlap to clearly show positioning
    if (isDragging) return 0;
    
    // No offset needed for small number of cards (easier to drag)
    if (totalCards <= 7) return 0;
    
    // Progressive overlapping based on total cards
    if (totalCards <= 9) return `-${15}px`;
    if (totalCards <= 11) return `-${25}px`;
    if (totalCards <= 13) return `-${35}px`;
    return `-${45}px`; // Maximum overlap for 14+ cards
  };
  
  return (
    <div>
      {title && <div className="text-gray-400 text-sm mb-2">{title}</div>}
      
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEndWithState}>
        <Droppable droppableId="cards" direction="horizontal">
          {(provided, snapshot) => (
            <div 
              className={`flex flex-row ${isQueue ? 'overflow-x-auto py-2 w-full flex-nowrap' : 'flex-wrap'} 
                        ${isDragging ? 'gap-3' : 'gap-2'} 
                        ${isQueue ? 'min-h-[110px]' : 'min-h-[120px]'}
                        ${snapshot.isDraggingOver ? 'bg-gray-800/20 rounded-lg px-1' : ''}`}
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {cards.map((card, index) => (
                <Draggable key={`${card.id}-${index}`} draggableId={`${card.id}-${index}`} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`
                        transition-all duration-200 
                        ${snapshot.isDragging ? 'z-50 brightness-125 shadow-lg shadow-cyan-500/50' : 
                          isQueue ? 'hover:z-50 hover:brightness-110 hover:shadow-lg hover:shadow-cyan-900/50' : 'hover:scale-105'} 
                        relative 
                        ${isQueue ? 'first:ml-0' : ''}
                      `}
                      style={{ 
                        ...provided.draggableProps.style,
                        transform: `${provided.draggableProps.style?.transform} scale(${snapshot.isDragging ? 1.05 : getCardScale(cards.length, index)})`,
                        marginLeft: isQueue && index > 0 ? getCardOffset(cards.length, index) : undefined,
                        zIndex: snapshot.isDragging ? 100 : isQueue ? cards.length - index : undefined,
                        transition: snapshot.isDragging ? 'transform 0.05s ease-out' : 'transform 0.2s ease-out, margin 0.2s ease-out, box-shadow 0.2s ease',
                        // Add a subtle drop shadow to make the card pop during drag
                        boxShadow: snapshot.isDragging ? '0 10px 25px -5px rgba(8, 145, 178, 0.5)' : undefined
                      }}
                    >
                      {/* Extra visual feedback during dragging */}
                      {snapshot.isDragging && (
                        <div className="absolute inset-0 border-2 border-cyan-500 rounded-md bg-cyan-500/10 z-0"></div>
                      )}
                      
                      {/* Execution order indicator for queue */}
                      {isQueue && (
                        <div className={`absolute -top-2 -left-2 bg-cyan-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10 border-2 border-gray-800 ${snapshot.isDragging ? 'animate-pulse' : ''}`}>
                          {index + 1}
                        </div>
                      )}
                      <Card 
                        card={card}
                        onClick={() => onCardClick(index)}
                        disabled={!canPlayCards}
                      />
                    </div>
                  )}
                </Draggable>
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