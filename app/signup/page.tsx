'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CityWiseLogo from '@/components/CityWiseLogo';
import { signIn } from 'next-auth/react';

type UserRole = 'HOMEOWNER' | 'BUILDER' | 'DEVELOPER' | 'ARCHITECT' | 'ENGINEER' | 'REAL_ESTATE' | 'OTHER';

let googleMapsLoaded = false;
let googleMapsLoading = false;

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const businessAddressRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: '' as UserRole | '',
    companyName: '',
    licenseNumber: '',
    serviceArea: '',
    businessAddress: '',
    projectTypes: [] as string[],
    challenges: [] as string[],
  });

  const totalSteps = 5;

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (step !== 3 || formData.role === 'HOMEOWNER') return;

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
      if (!businessAddressRef.current) return;
      if (autocompleteRef.current) return;

      try {
        autocompleteRef.current = new google.maps.places.Autocomplete(
          businessAddressRef.current,
          {
            types: ['address'],
            componentRestrictions: { country: 'us' },
          }
        );

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) {
            setFormData({ ...formData, businessAddress: place.formatted_address });
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
  }, [step, formData.role]);

  const handleNext = () => {
    setError('');
    
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.phone) {
        setError('Please fill in all fields');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    if (step === 2) {
      if (!formData.role) {
        setError('Please select your role');
        return;
      }
    }

    if (step === 3 && formData.role !== 'HOMEOWNER') {
      if (!formData.companyName) {
        setError('Please enter your company name');
        return;
      }
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error('Account created but failed to sign in');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  const isCompanyRole = formData.role && formData.role !== 'HOMEOWNER';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2c4f6f] to-[#9caf88] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <CityWiseLogo theme="light" width={180} />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full mx-1 ${
                    s <= step ? 'bg-[#9caf88]' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600 text-center">
              Step {step} of {totalSteps}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">Create Your Account</h2>
              
              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-[#9caf88]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88]"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-[#9caf88]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88]"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-[#9caf88]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88]"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-[#9caf88]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88]"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">Tell Us About You</h2>
              
              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-3">
                  I am a: *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-4 py-3 border border-[#9caf88]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88]"
                >
                  <option value="">Select your role...</option>
                  <option value="HOMEOWNER">🏠 Homeowner</option>
                  <option value="BUILDER">🏗️ Builder/Contractor</option>
                  <option value="DEVELOPER">🏢 Developer</option>
                  <option value="ARCHITECT">📐 Architect/Designer</option>
                  <option value="ENGINEER">⚙️ Engineer</option>
                  <option value="REAL_ESTATE">🏘️ Real Estate Professional</option>
                  <option value="OTHER">💼 Other</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">
                {isCompanyRole ? 'Company Information' : 'Almost There!'}
              </h2>
              
              {isCompanyRole ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-3 border border-[#9caf88]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88]"
                      placeholder="ABC Construction"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                      Business Address (Optional)
                    </label>
                    <input
                      ref={businessAddressRef}
                      type="text"
                      value={formData.businessAddress}
                      onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                      className="w-full px-4 py-3 border border-[#9caf88]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88]"
                      placeholder="Start typing address..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                      License Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-[#9caf88]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88]"
                      placeholder="ROC12345"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                      Primary Service Area (Optional)
                    </label>
                    <select
                      value={formData.serviceArea}
                      onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
                      className="w-full px-4 py-3 border border-[#9caf88]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88]"
                    >
                      <option value="">Select area...</option>
                      <option value="Phoenix">Phoenix</option>
                      <option value="Scottsdale">Scottsdale</option>
                      <option value="Tempe">Tempe</option>
                      <option value="Mesa">Mesa</option>
                      <option value="Chandler">Chandler</option>
                      <option value="Gilbert">Gilbert</option>
                      <option value="Glendale">Glendale</option>
                      <option value="Peoria">Peoria</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    Great! Let's learn a bit more about your projects.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">Project Focus</h2>
              
              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-3">
                  What types of projects do you typically work on? (Select all that apply)
                </label>
                <div className="space-y-3">
                  {[
                    'New Single-Family Homes',
                    'Additions',
                    'Remodels',
                    'ADUs (Accessory Dwelling Units)',
                    'Multi-Family',
                    'Commercial (Light)',
                  ].map((type) => (
                    <label
                      key={type}
                      className="flex items-center p-3 border border-[#9caf88]/30 rounded-lg cursor-pointer hover:bg-[#9caf88]/5"
                    >
                      <input
                        type="checkbox"
                        checked={formData.projectTypes.includes(type)}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            projectTypes: toggleArrayItem(formData.projectTypes, type),
                          })
                        }
                        className="w-5 h-5 text-[#9caf88] border-gray-300 rounded focus:ring-[#9caf88]"
                      />
                      <span className="ml-3 text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">What Brings You to CityWise?</h2>
              
              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-3">
                  What's your biggest challenge with permits? (Select all that apply)
                </label>
                <div className="space-y-3">
                  {[
                    '⏱️ Understanding requirements',
                    '📋 Organizing documentation',
                    '⚡ Speeding up approval process',
                    '💰 Cost estimation',
                    '🤝 Finding engineers/consultants',
                  ].map((challenge) => (
                    <label
                      key={challenge}
                      className="flex items-center p-3 border border-[#9caf88]/30 rounded-lg cursor-pointer hover:bg-[#9caf88]/5"
                    >
                      <input
                        type="checkbox"
                        checked={formData.challenges.includes(challenge)}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            challenges: toggleArrayItem(formData.challenges, challenge),
                          })
                        }
                        className="w-5 h-5 text-[#9caf88] border-gray-300 rounded focus:ring-[#9caf88]"
                      />
                      <span className="ml-3 text-gray-700">{challenge}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex-1 px-6 py-3 border border-[#9caf88] text-[#1e3a5f] rounded-lg font-semibold hover:bg-[#9caf88]/10 transition-colors disabled:opacity-50"
              >
                Back
              </button>
            )}
            
            {step < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-[#1e3a5f] text-white rounded-lg font-semibold hover:bg-[#2c4f6f] transition-colors disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-[#d4836f] text-white rounded-lg font-semibold hover:bg-[#c86f4d] transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Complete Sign Up'}
              </button>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-[#1e3a5f] font-semibold hover:text-[#2c4f6f]">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
