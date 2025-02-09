import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function Terms() {
  const [terms, setTerms] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const isIframe = searchParams.get('iframe') === '1';

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await fetch('/terms.txt');
        const text = await response.text();
        setTerms(text);
      } catch (error) {
        console.error('Failed to load terms:', error);
        setTerms('Failed to load terms of service. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <Shield className="h-12 w-12 text-orange-500 mx-auto mb-4" />
      </div>

      <div className="prose prose-invert prose-headings:text-white prose-headings:font-bold prose-p:text-gray-400 prose-strong:text-white prose-ul:text-gray-400 max-w-none">
        <ReactMarkdown>{terms}</ReactMarkdown>
      </div>
    </div>
  );
}