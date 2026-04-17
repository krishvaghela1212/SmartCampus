import React from 'react';
import { BroadcastMessage } from '../types';
import { Megaphone, Clock } from 'lucide-react';

interface BroadcastBoardProps {
  broadcasts: BroadcastMessage[];
}

export const BroadcastBoard: React.FC<BroadcastBoardProps> = ({ broadcasts }) => {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="bg-bgSecondary px-4 py-3 flex items-center border-b border-border">
        <Megaphone className="text-accent w-5 h-5 mr-2" />
        <h2 className="text-textPrimary font-semibold">Broadcast Board</h2>
      </div>
      
      <div className="divide-y divide-border max-h-80 overflow-y-auto">
        {broadcasts.length === 0 ? (
          <div className="p-4 text-center text-textSecondary text-sm">No new announcements.</div>
        ) : (
          broadcasts.map((msg) => (
            <div key={msg.id} className="p-4 hover:bg-bgSecondary transition-colors border-l-4 border-l-transparent hover:border-l-accent">
              <div className="flex justify-between items-start mb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-bgPrimary bg-accent px-2 py-0.5 rounded-md uppercase">
                    {msg.department || 'Global'}
                  </span>
                  {msg.targetSemester && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${msg.targetSemester === 'ALL' ? 'bg-bgSecondary text-textSecondary border-border' : 'bg-warning/10 text-warning border-warning/30'}`}>
                      {msg.targetSemester === 'ALL' ? 'ALL SEM' : `SEM ${msg.targetSemester}`}
                    </span>
                  )}
                </div>
                <div className="flex items-center text-xs text-textSecondary">
                  <Clock className="w-3 h-3 mr-1" />
                  {msg.timestamp}
                </div>
              </div>
              <p className="text-sm text-textPrimary font-medium mb-1 mt-2">{msg.message}</p>
              <p className="text-xs text-textSecondary">- {msg.facultyName}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};