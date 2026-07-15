import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface MessageType {
  text: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

type MessageStatus = MessageType['type'];

interface MessageContextProps {
  message: MessageType | null;
  setMessage: (text: string, type?: MessageStatus) => void;
  clearMessage: () => void;
}

const MessageContext = createContext<MessageContextProps | undefined>(undefined);

// Provides the message state globally to the application.
export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [message, setMessageState] = useState<MessageType | null>(null);

  const setMessage = (text: string, type: MessageStatus = 'success') => {
    setMessageState({ text, type });
  };

  const clearMessage = () => setMessageState(null);

  return (
    <MessageContext.Provider value={{ message, setMessage, clearMessage }}>
      {children}
    </MessageContext.Provider>
  );
};

// Custom hook to consume the message context easily.
export const useMessage = (): MessageContextProps => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};
