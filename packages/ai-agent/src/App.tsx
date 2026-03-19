import React from 'react';
import { useEventAgent } from '@/hooks/useEventAgent';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import MessageList from '@/components/MessageList';
import InputArea from '@/components/InputArea';
import SuccessScreen from '@/components/SuccessScreen';

const App: React.FC = () => {
  const {
    messages,
    eventData,
    userTier,
    isTyping,
    screen,
    inputValue,
    setInputValue,
    sendMessage,
    launchDraft,
  } = useEventAgent();

  return (
    <div className="max-w-container mx-auto min-h-screen flex flex-col bg-white">
      <Header userTier={userTier} />

      {screen === 'agent' ? (
        <div className="flex flex-col flex-1">
          <HeroBanner />
          <MessageList messages={messages} isTyping={isTyping} />
          <InputArea
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSend={sendMessage}
            isTyping={isTyping}
          />
        </div>
      ) : (
        <SuccessScreen
          variant={screen === 'success' ? 'launched' : 'draft'}
          eventData={eventData}
          userTier={userTier}
          onLaunchDraft={launchDraft}
        />
      )}
    </div>
  );
};

export default App;
