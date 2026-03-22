import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuestionRenderer } from '@/components/survey/QuestionRenderer';
import type { Question, SurveyResponse } from '@/types';

vi.mock('@/utils/aliasStore', () => ({
  aliasStore: {
    getAliases: () => [],
  },
}));

const topOfMindQuestion: Question = {
  id: 'c1_top_of_mind',
  type: 'text',
  section: 'C',
  label: {
    en: 'Which bank from your country comes to your mind FIRST?',
    rw: 'Q1',
    fr: 'Q1',
  },
  required: true,
};

const spontaneousQuestion: Question = {
  id: 'c2_spontaneous',
  type: 'text',
  section: 'C',
  label: {
    en: 'Which other banks from your country come to your mind?',
    rw: 'Q2',
    fr: 'Q2',
  },
  required: true,
};

const RendererHarness: React.FC<{
  question: Question;
  initialValue?: string;
  initialFormData?: Partial<SurveyResponse>;
}> = ({ question, initialValue = '', initialFormData = {} }) => {
  const [value, setValue] = useState(initialValue);
  const [formData, setFormData] = useState<Partial<SurveyResponse>>({
    selected_country: 'rwanda',
    country: 'rwanda',
    ...initialFormData,
    [question.id]: initialValue,
  });

  return (
    <QuestionRenderer
      question={question}
      value={value}
      formData={formData}
      lang="en"
      onChange={(next) => {
        const text = String(next || '');
        setValue(text);
        setFormData((prev) => ({ ...prev, [question.id]: text }));
      }}
      onMetaChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
    />
  );
};

describe('QuestionRenderer bank recognition UX', () => {
  it('confirms a valid top-of-mind bank immediately without a stale recognizing state', () => {
    render(<RendererHarness question={topOfMindQuestion} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'KCB' } });

    expect(screen.getByText(/Matched: KCB/i)).toBeInTheDocument();
    expect(screen.queryByText(/Recognizing bank names/i)).not.toBeInTheDocument();
  });

  it('shows clear invalid feedback for unrecognized top-of-mind input', () => {
    render(<RendererHarness question={topOfMindQuestion} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Unknown Bank Name' } });

    expect(screen.getByText(/Not recognized yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/Matched:/i)).not.toBeInTheDocument();
  });

  it('keeps Q2 recognition behavior intact and marks the Q1 bank as already captured', () => {
    render(
      <RendererHarness
        question={spontaneousQuestion}
        initialFormData={{
          c1_top_of_mind: 'KCB',
        }}
      />,
    );

    expect(screen.getByText(/Already captured from Q1: KCB/i)).toBeInTheDocument();
    expect(screen.queryByText(/Recognized in this answer:/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'KCB, BK' } });

    expect(screen.getByText(/Recognized in this answer: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Already captured in Q1: KCB/i)).toBeInTheDocument();
  });
});
