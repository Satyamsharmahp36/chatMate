import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, MessageCircle, LightbulbIcon, ExternalLink, Settings, ChevronDown, X, Trash2, Save, Lock, Unlock, AlertTriangle, Filter, Plus, CheckCircle, XCircle, Clock, Info, HelpCircle } from 'lucide-react';
import { getAnswer } from '../services/ai';
import { motion, AnimatePresence } from 'framer-motion';
import ContributionForm from './ContributionForm';
import AdminModal from './AdminModal';
import MessageContent from './MessageContent';

const ChatBot = ({ userName, userData, onRefetchUserData, presentUserData }) => {
  const chatHistoryKey = `${userName || 'anonymous'}_${userData.user.name}`;

  const [messages, setMessages] = useState(() => {
    const allChatHistories = JSON.parse(localStorage.getItem('chatHistories') || '{}');
    
    const userChatHistory = allChatHistories[chatHistoryKey] 
      ? allChatHistories[chatHistoryKey] 
      : [
          {
            type: 'bot',
            content: `Hi${userName ? ' ' + userName : ''}! I'm ${userData.user.name} AI assistant. Feel free to ask me about my projects, experience, or skills!`,
            timestamp: new Date().toISOString()
          }
        ];

    return userChatHistory;
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [promptUpdated, setPromptUpdated] = useState(false);
  const [lastQuestion, setLastQuestion] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(userData);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Keep local state in sync with props
  useEffect(() => {
    setCurrentUserData(userData);
  }, [userData]);

  const clearChatHistory = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDeleteHistory = () => {
    const allChatHistories = JSON.parse(localStorage.getItem('chatHistories') || '{}');
    delete allChatHistories[chatHistoryKey];
    localStorage.setItem('chatHistories', JSON.stringify(allChatHistories));

    const initialMessage = {
      type: 'bot',
      content: `Hi${userName ? ' ' + userName : ''}! I'm ${userData.user.name} AI assistant. Feel free to ask me about my projects, experience, or skills!`,
      timestamp: new Date().toISOString()
    };

    setMessages([initialMessage]);
    setShowDeleteConfirmation(false);
    setShowDeleteSuccessModal(true);

    setTimeout(() => {
      setShowDeleteSuccessModal(false);
    }, 3000);
  };

  useEffect(() => {
    if (!userName) {
      const storedName = sessionStorage.getItem('userName');
      if (storedName) {
        const updatedChatHistoryKey = `${storedName}_${userData.user.name}`;
        const allChatHistories = JSON.parse(localStorage.getItem('chatHistories') || '{}');
        
        if (allChatHistories[updatedChatHistoryKey]) {
          setMessages(allChatHistories[updatedChatHistoryKey]);
        } else if (messages.length === 1 && messages[0].type === 'bot') {
          setMessages([
            {
              type: 'bot',
              content: `Hi ${storedName}! I'm ${userData.user.name}'s AI assistant. Feel free to ask me about my projects, experience, or skills!`,
              timestamp: new Date().toISOString()
            }
          ]);
        }
      }
    }
  }, [userName, userData.user.name]);

  useEffect(() => {
    const allChatHistories = JSON.parse(localStorage.getItem('chatHistories') || '{}');
    
    if (allChatHistories[chatHistoryKey]) {
      setMessages(allChatHistories[chatHistoryKey]);
    }
  }, [chatHistoryKey]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      const allChatHistories = JSON.parse(localStorage.getItem('chatHistories') || '{}');
      allChatHistories[chatHistoryKey] = messages;
      localStorage.setItem('chatHistories', JSON.stringify(allChatHistories));
    }
  }, [messages, chatHistoryKey]);

  useEffect(() => {
    const handleResize = () => {
      scrollToBottom();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = {
      type: 'user',
      content: input,
      timestamp: new Date().toISOString() 
    };

    setMessages(prev => [...prev, userMessage]);
    setLastQuestion(input);
    setInput('');
    setIsLoading(true);

    inputRef.current?.focus();

    try {
      const response = await getAnswer(input, currentUserData.user, presentUserData ? presentUserData.user : null);
      
      const botMessage = {
        type: 'bot',
        content: response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting answer:', error);
      
      const errorMessage = {
        type: 'bot',
        content: "I'm sorry, I couldn't process your request. Please try again later.",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const DeleteConfirmationModal = () => (
    <AnimatePresence>
      {showDeleteConfirmation && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-gray-800 p-6 rounded-lg text-white max-w-md w-full"
          >
            <h2 className="text-xl font-bold mb-4">Delete Chat History</h2>
            <p className="mb-6">Are you sure you want to delete your entire chat history? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button 
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDeleteHistory}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePromptUpdated = async () => {
    try {
      const updatedData = await onRefetchUserData();
      
      if (updatedData) {
        setCurrentUserData(updatedData);
      }
      
      setPromptUpdated(true);
      
      setTimeout(() => setPromptUpdated(false), 3000);
    } catch (error) {
      console.error('Error refetching user data:', error);
    }
  };

  const handleContriUpdated = async () => {
    try {
      console.log("Contribution updated, fetching fresh data...");
      const updatedData = await onRefetchUserData();
      
      if (updatedData) {
        console.log("Fresh data received:", updatedData);
        setCurrentUserData(updatedData);
      } else {
        console.log("No data returned from onRefetchUserData");
      }
      
      setPromptUpdated(true);
      setTimeout(() => setPromptUpdated(false), 3000);
      
    } catch (error) {
      console.error('Error refetching user data:', error);
    }
  };

  const autoResizeTextarea = (e) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  return (
    <div className="flex flex-col h-screen md:h-11/12 lg:max-w-1/2 lg:rounded-xl text-xl bg-gray-900 text-white shadow-2xl overflow-hidden">
      <div className="bg-gray-800 py-4 rounded-t-xl px-6 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center">
          <Bot className="w-6 h-6 text-blue-400 mr-2" />
          <h1 className="text-xl font-bold"> {currentUserData.user.name}'s AI Assistant</h1>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowContributionForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Contribute</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(true)}
            className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chat-messages-container">
        <AnimatePresence>
          {promptUpdated && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-900 bg-opacity-20 border border-green-500 rounded-lg p-3 text-green-300 flex items-center"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Knowledge base updated successfully! I'm now equipped with the latest information.
            </motion.div>
          )}
        </AnimatePresence>

        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-start ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 shadow-md ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-800 text-white rounded-bl-none border border-gray-700'
              }`}
            >
              <div className="flex items-center mb-1">
                {message.type === 'bot' ? (
                  <Bot className="w-4 h-4 mr-2 text-blue-400" />
                ) : (
                  <User className="w-4 h-4 mr-2 text-blue-300" />
                )}
                <div className="text-xs opacity-70">
                  {message.type === 'bot' ? 'Assistant' : sessionStorage.getItem('userName') || 'You'}
                  {message.timestamp && (
                    <span className="ml-2 text-xs opacity-50">
                      {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm whitespace-pre-wrap break-words">
                {message.type === 'bot' && index === messages.length - 1 && isLoading ? (
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  </motion.div>
                ) : (
                  <MessageContent content={message.content} />
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && messages[messages.length - 1]?.type === 'user' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-start justify-start"
          >
            <div className="max-w-[80%] rounded-lg p-3 shadow-md bg-gray-800 text-white rounded-bl-none border border-gray-700">
              <div className="flex items-center mb-1">
                <Bot className="w-4 h-4 mr-2 text-blue-400" />
                <div className="text-xs opacity-70">Assistant</div>
              </div>
              <div className="text-sm">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div>
        <div className="flex items-end p-4 border-t border-gray-700">
          <div className="relative flex items-center w-full rounded-lg bg-gray-800 p-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResizeTextarea(e);
              }}
              onKeyDown={handleKeyPress}
              placeholder={`Ask me anything about ${currentUserData.user.name} ...`}
              className="flex-1 bg-transparent outline-none resize-none text-white placeholder-gray-400 max-h-32"
              rows={1}
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSendMessage}
              disabled={isLoading || input.trim() === ''}
              className="p-2 ml-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-5 h-5" />
                </motion.div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearChatHistory}
              className="p-2 ml-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteSuccessModal && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Chat history deleted successfully
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key addition: pass current state to AdminModal */}
      <AdminModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onPromptUpdated={handlePromptUpdated}
        password={currentUserData.user.password}
        userData={currentUserData.user}
      />

      <ContributionForm
        isOpen={showContributionForm}
        onClose={() => setShowContributionForm(false)}
        lastQuestion={lastQuestion}
        onContriUpdated={handleContriUpdated}
      />

      <DeleteConfirmationModal />

    </div>
  );
};

export default ChatBot;