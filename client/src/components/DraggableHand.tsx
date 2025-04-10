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
    
    // Scale slightly smaller as we add more cards
    const baseScale = Math.max(0.85, 1 - (totalCards * 0.03));
    return baseScale;
  };
  
  // Calculate card overlap for queue mode
  const getCardOffset = (totalCards: number, index: number) => {
    // No offset needed for small number of cards
    if (totalCards <= 4) return 0;
    
    // Increasing overlap for more cards, expressed as negative margin
    return `-${Math.min(40, totalCards * 5)}px`;
  };
  
  return (
    <div>
      {title && <div className="text-gray-400 text-sm mb-2">{title}</div>}
      
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="cards" direction="horizontal">
          {(provided) => (
            <div 
              className={`flex ${isQueue ? 'flex-row overflow-x-auto py-2' : 'flex-wrap'} gap-2 min-h-[120px] ${isQueue ? 'w-full' : ''}`}
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
                      className={`transition-transform duration-200 hover:scale-105 relative ${isQueue ? 'first:ml-0' : ''}`}
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