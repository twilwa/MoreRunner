import React from 'react';
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
  // Calculate a scale factor for cards when there are many in the queue
  const getCardScale = (totalCards: number, index: number) => {
    // No scaling needed for small number of cards
    if (totalCards <= 4) return 1;
    
    // Progressive scaling based on number of cards
    // The more cards we have, the smaller they get
    if (totalCards <= 6) return 0.95;
    if (totalCards <= 8) return 0.9;
    if (totalCards <= 10) return 0.85;
    return 0.8; // Minimum size for 11+ cards
  };
  
  // Calculate card overlap for queue mode
  const getCardOffset = (totalCards: number, index: number) => {
    // No offset needed for small number of cards
    if (totalCards <= 4) return 0;
    
    // Progressive overlapping based on total cards
    if (totalCards <= 6) return `-${20}px`;
    if (totalCards <= 8) return `-${30}px`;
    if (totalCards <= 10) return `-${40}px`;
    return `-${50}px`; // Maximum overlap for 11+ cards
  };
  
  return (
    <div>
      {title && <div className="text-gray-400 text-sm mb-2">{title}</div>}
      
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="cards" direction="horizontal">
          {(provided) => (
            <div 
              className={`flex flex-row ${isQueue ? 'overflow-x-auto py-2 w-full flex-nowrap' : 'flex-wrap'} gap-2 ${isQueue ? 'min-h-[100px]' : 'min-h-[120px]'}`}
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {cards.map((card, index) => (
                <Draggable key={`${card.id}-${index}`} draggableId={`${card.id}-${index}`} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`transition-all duration-200 ${isQueue ? 'hover:z-50 hover:brightness-110 hover:shadow-lg hover:shadow-cyan-900/50' : 'hover:scale-105'} relative ${isQueue ? 'first:ml-0' : ''}`}
                      style={{ 
                        ...provided.draggableProps.style,
                        transform: `${provided.draggableProps.style?.transform} scale(${getCardScale(cards.length, index)})`,
                        marginLeft: isQueue && index > 0 ? getCardOffset(cards.length, index) : undefined,
                        zIndex: isQueue ? cards.length - index : undefined
                      }}
                    >
                      {/* Execution order indicator for queue */}
                      {isQueue && (
                        <div className="absolute -top-2 -left-2 bg-cyan-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10 border-2 border-gray-800">
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