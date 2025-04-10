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
}

const DraggableHand: React.FC<DraggableHandProps> = ({
  cards,
  onCardClick,
  onDragEnd,
  canPlayCards = true,
  title
}) => {
  return (
    <div>
      {title && <div className="text-gray-400 text-sm mb-2">{title}</div>}
      
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="cards" direction="horizontal">
          {(provided) => (
            <div 
              className="flex flex-wrap gap-2 min-h-[120px]"
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
                      className="transition-transform duration-200 hover:scale-105"
                      style={{ ...provided.draggableProps.style }}
                    >
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