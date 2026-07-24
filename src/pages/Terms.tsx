import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from '../i18n';
import { Spinner } from '../components/ui';

export function Terms() {
  const [terms, setTerms] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { lang } = useTranslation();

  useEffect(() => {
    let cancelled = false;

    const fetchText = async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load ${url}`);
      return response.text();
    };

    const fetchTerms = async () => {
      setLoading(true);
      try {
        // Try the language-specific file first, fall back to the English default.
        let text: string;
        try {
          text = await fetchText(lang === 'en' ? '/terms.md' : `/terms.${lang}.md`);
        } catch {
          text = await fetchText('/terms.md');
        }
        if (!cancelled) setTerms(text);
      } catch (error) {
        console.error('Failed to load terms:', error);
        if (!cancelled) setTerms('Failed to load terms of service. Please try again later.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchTerms();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  if (loading) {
    return <Spinner page />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
      </div>

      <div className="prose prose-headings:text-on-surface prose-headings:font-display prose-headings:font-semibold prose-p:text-secondary prose-a:text-primary prose-strong:text-on-surface prose-ul:text-secondary prose-ol:text-secondary prose-li:text-secondary prose-li:marker:text-outline prose-code:text-on-surface prose-blockquote:text-secondary prose-blockquote:border-outline-variant prose-hr:border-outline-variant max-w-none">
        <ReactMarkdown>{terms}</ReactMarkdown>
      </div>
    </div>
  );
}