'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Send, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ParcelData {
  address: string;
  jurisdiction: string;
  lotSizeSqFt: number;
  apn: string;
  zoning: string;
  existingSqFt?: number | null;
}

let googleMapsLoaded = false;
let googleMapsLoading = false;

export default function AIScopeChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateButton, setShowCreateButton] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [addressInput, setAddressInput] = useState('');
  const [parcelData, setParcelData] = useState<ParcelData | null>(null);
  const [isFetchingParcel, setIsFetchingParcel] = useState(false);
  
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        googleMapsLoaded = true;
        initAutocomplete();
        return;
      }

      if (googleMapsLoading) {
        const checkInterval = setInterval(() => {
          if (googleMapsLoaded && typeof google !== 'undefined' && google.maps && google.maps.places) {
            clearInterval(checkInterval);
            initAutocomplete();
          }
        }, 100);
        return;
      }

      googleMapsLoading = true;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        googleMapsLoaded = true;
        googleMapsLoading = false;
        initAutocomplete();
      };
      script.onerror = () => {
        googleMapsLoading = false;
        console.error('Failed to load Google Maps');
      };
      document.head.appendChild(script);
    };

    const initAutocomplete = () => {
      if (!addressInputRef.current) return;
      if (autocompleteRef.current) return;

      try {
        autocompleteRef.current = new google.maps.places.Autocomplete(
          addressInputRef.current,
          {
            types: ['address'],
            componentRestrictions: { country: 'us' },
          }
        );

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) {
            setAddressInput(place.formatted_address);
            handleAddressSearch(place.formatted_address);
          }
        });
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    };

    loadGoogleMaps();

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (parcelData && messages.length === 0) {
      startConversation();
    }
  }, [parcelData]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && 
        lastMessage.content.toLowerCase().includes("let's get started")) {
      setShowCreateButton(true);
    }
  }, [messages]);

  const handleAddressSearch = async (address?: string) => {
    const searchAddress = address || addressInput;
    if (!searchAddress.trim()) return;
    
    setIsFetchingParcel(true);
    try {
      const response = await fetch('/api/parcels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: searchAddress }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setParcelData(data);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to find property');
      }
    } catch (error) {
      console.error('Error fetching parcel:', error);
      alert('Failed to search property');
    } finally {
      setIsFetchingParcel(false);
    }
  };

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const contextMessage = `The user is working on a project at ${parcelData?.address}. Property details: Lot size ${parcelData?.lotSizeSqFt} sq ft, Jurisdiction: ${parcelData?.jurisdiction}, Zoning: ${parcelData?.zoning}${parcelData?.existingSqFt ? `, Existing building: ${parcelData.existingSqFt} sq ft` : ''}. Start the conversation.`;
      
      const response = await fetch('/api/ai-scope/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: contextMessage }],
        }),
      });

      const data = await response.json();
      setMessages([{ role: 'assistant', content: data.content }]);
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-scope/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();
      setMessages([...updatedMessages, { role: 'assistant', content: data.content }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    setIsCreating(true);
    try {
      const extractResponse = await fetch('/api/ai-scope/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      const { projectData } = await extractResponse.json();

      const createResponse = await fetch('/api/ai-scope/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectData: { ...projectData, fullAddress: parcelData?.address } }),
      });

      const { projectId } = await createResponse.json();
      router.push(`/dashboard?project=${projectId}`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {!parcelData && (
        <Card className="bg-[#faf8f3] border-0 shadow-2xl p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#1e3a5f] mb-4">
              <MapPin className="h-5 w-5 text-[#9caf88]" />
              <h2 className="text-lg font-semibold">Property Address</h2>
            </div>
            <div className="flex gap-2">
              <Input
                ref={addressInputRef}
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
                placeholder="Start typing address..."
                className="flex-1 border-[#9caf88]/30 focus:border-[#9caf88] focus:ring-[#9caf88]"
                disabled={isFetchingParcel}
              />
              <Button
                onClick={() => handleAddressSearch()}
                disabled={isFetchingParcel || !addressInput.trim()}
                className="bg-[#1e3a5f] hover:bg-[#2c4f6f] text-white"
              >
                {isFetchingParcel ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {parcelData && (
        <Card className="bg-[#faf8f3] border-0 shadow-2xl p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#1e3a5f]">
                <MapPin className="h-5 w-5 text-[#9caf88]" />
                <h3 className="font-semibold">{parcelData.address}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mt-4">
                <div>
                  <span className="font-medium text-[#1e3a5f]">Lot Size:</span> {parcelData.lotSizeSqFt.toLocaleString()} sq ft
                </div>
                <div>
                  <span className="font-medium text-[#1e3a5f]">Jurisdiction:</span> {parcelData.jurisdiction}
                </div>
                <div>
                  <span className="font-medium text-[#1e3a5f]">Zoning:</span> {parcelData.zoning}
                </div>
                <div>
                  <span className="font-medium text-[#1e3a5f]">APN:</span> {parcelData.apn}
                </div>
                {parcelData.existingSqFt && (
                  <div>
                    <span className="font-medium text-[#1e3a5f]">Existing SF:</span> {parcelData.existingSqFt.toLocaleString()} sq ft
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setParcelData(null);
                setMessages([]);
                setShowCreateButton(false);
              }}
              className="text-gray-600 hover:text-[#1e3a5f] hover:bg-[#9caf88]/10"
            >
              Change
            </Button>
          </div>
        </Card>
      )}

      {parcelData && (
        <>
          <Card className="bg-[#faf8f3] border-0 shadow-2xl h-[500px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-[#1e3a5f] text-white'
                        : 'bg-white border border-[#9caf88]/20 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#9caf88]/20 rounded-lg px-4 py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-[#9caf88]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {!showCreateButton && (
              <div className="p-6 border-t border-[#9caf88]/20">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your answer..."
                    disabled={isLoading}
                    className="flex-1 border-[#9caf88]/30 focus:border-[#9caf88] focus:ring-[#9caf88]"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    className="bg-[#1e3a5f] hover:bg-[#2c4f6f] text-white"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {showCreateButton && (
            <Button
              onClick={handleCreateProject}
              disabled={isCreating}
              className="w-full bg-[#d4836f] hover:bg-[#c86f4d] text-white py-6 text-lg font-semibold shadow-lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Creating Your Project...
                </>
              ) : (
                '✓ Create Project'
              )}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
