import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuestionRenderer } from '@/components/survey/QuestionRenderer';
import type { Question, SurveyResponse } from '@/types';
import { isQuestionAnswered } from '@/utils/survey/normalization';

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
  onMetaChangeSpy?: ReturnType<typeof vi.fn>;
}> = ({ question, initialValue = '', initialFormData = {}, onMetaChangeSpy }) => {
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
      onMetaChange={(patch) => {
        onMetaChangeSpy?.(patch);
        setFormData((prev) => ({ ...prev, ...patch }));
      }}
    />
  );
};

const RendererWithCtaHarness: React.FC<{
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
    <>
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
      <button disabled={!isQuestionAnswered(question, formData)}>Continue</button>
    </>
  );
};

const QuestionSwitchHarness: React.FC = () => {
  const [question, setQuestion] = useState<Question>(topOfMindQuestion);
  const [formData, setFormData] = useState<Partial<SurveyResponse>>({
    selected_country: 'uganda',
    country: 'uganda',
    c1_top_of_mind: '',
    c2_spontaneous: '',
  });

  return (
    <>
      <QuestionRenderer
        question={question}
        value={formData[question.id as keyof SurveyResponse] as string | undefined}
        formData={formData}
        lang="en"
        onChange={(next) => {
          const text = String(next || '');
          setFormData((prev) => ({ ...prev, [question.id]: text }));
        }}
        onMetaChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
      />
      <button onClick={() => setQuestion(spontaneousQuestion)}>Next Question</button>
    </>
  );
};

describe('QuestionRenderer bank recognition UX', () => {
  afterEach(() => {
    cleanup();
  });

  it('keeps top-of-mind feedback neutral while the respondent is still typing', async () => {
    render(<RendererHarness question={topOfMindQuestion} />);

    fireEvent.focus(screen.getByRole('textbox'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'KC' } });

    expect(screen.getByText(/Keep typing the bank name/i)).toBeInTheDocument();
    expect(screen.queryByText(/Not recognized yet/i)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Keep typing the bank name/i)).toBeInTheDocument();
      expect(screen.queryByText(/Not recognized yet/i)).not.toBeInTheDocument();
    });
  });

  it('confirms a valid top-of-mind bank after the recognition pause', async () => {
    render(<RendererHarness question={topOfMindQuestion} />);

    fireEvent.focus(screen.getByRole('textbox'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'KCB' } });

    expect(await screen.findByText(/Matched: KCB/i)).toBeInTheDocument();
    expect(screen.queryByText(/Not recognized yet/i)).not.toBeInTheDocument();
  });

  it('enables CTA promptly after a valid top-of-mind answer and disables again when cleared', async () => {
    render(<RendererWithCtaHarness question={topOfMindQuestion} />);

    const textbox = screen.getByRole('textbox');
    const cta = screen.getByRole('button', { name: 'Continue' });
    expect(cta).toBeDisabled();

    fireEvent.focus(textbox);
    fireEvent.change(textbox, { target: { value: 'kcb' } });
    await waitFor(() => expect(cta).toBeEnabled());

    fireEvent.change(textbox, { target: { value: '' } });
    await waitFor(() => expect(cta).toBeDisabled());
  });

  it('handles pasted top-of-mind values without delaying validation', async () => {
    render(<RendererWithCtaHarness question={topOfMindQuestion} initialFormData={{ selected_country: 'uganda', country: 'uganda' }} />);

    const textbox = screen.getByRole('textbox');
    const cta = screen.getByRole('button', { name: 'Continue' });
    fireEvent.focus(textbox);
    fireEvent.paste(textbox, {
      clipboardData: {
        getData: () => 'stanbic',
      },
    });
    fireEvent.change(textbox, { target: { value: 'stanbic' } });

    expect(await screen.findByText(/Matched: Stanbic/i)).toBeInTheDocument();
    await waitFor(() => expect(cta).toBeEnabled());
  });

  it('shows invalid feedback only after typing settles on an unrecognized top-of-mind input', async () => {
    render(<RendererHarness question={topOfMindQuestion} />);

    fireEvent.focus(screen.getByRole('textbox'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Unknown Bank Name' } });

    expect(screen.getByText(/Keep typing the bank name/i)).toBeInTheDocument();
    expect(screen.queryByText(/Not recognized yet/i)).not.toBeInTheDocument();

    expect(await screen.findByText(/Not recognized yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/Matched:/i)).not.toBeInTheDocument();
  });

  it('keeps the same top-of-mind input element mounted while recognition feedback updates', async () => {
    render(<RendererHarness question={topOfMindQuestion} initialFormData={{ selected_country: 'uganda', country: 'uganda' }} />);

    const textbox = screen.getByRole('textbox');
    fireEvent.focus(textbox);
    fireEvent.change(textbox, { target: { value: 'K' } });
    expect(screen.getByRole('textbox')).toBe(textbox);

    fireEvent.change(textbox, { target: { value: 'KC' } });
    expect(screen.getByRole('textbox')).toBe(textbox);

    fireEvent.change(textbox, { target: { value: 'KCB' } });
    expect(screen.getByRole('textbox')).toBe(textbox);
    expect(await screen.findByText(/Matched: KCB/i)).toBeInTheDocument();

    fireEvent.change(textbox, { target: { value: 'KCBA' } });
    expect(screen.getByRole('textbox')).toBe(textbox);
    await waitFor(() => {
      expect(screen.queryByText(/Matched: KCB/i)).not.toBeInTheDocument();
    });
  });

  it('keeps Q2 recognition behavior intact and marks the Q1 bank as already captured', async () => {
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

    const textbox = screen.getByRole('textbox');
    fireEvent.focus(textbox);
    fireEvent.change(textbox, { target: { value: 'KCB, BK' } });
    expect(screen.getByText(/Keep typing bank names/i)).toBeInTheDocument();

    expect(await screen.findByText(/Recognized in this answer: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Already captured in Q1: KCB/i)).toBeInTheDocument();
  });

  it('recognizes pasted spontaneous awareness entries and enables CTA promptly', async () => {
    render(
      <RendererWithCtaHarness
        question={spontaneousQuestion}
        initialFormData={{ selected_country: 'uganda', country: 'uganda', c1_top_of_mind: 'KCB' }}
      />,
    );

    const textbox = screen.getByRole('textbox');
    const cta = screen.getByRole('button', { name: 'Continue' });
    fireEvent.focus(textbox);
    fireEvent.change(textbox, { target: { value: 'dfcu, centenary' } });

    expect(await screen.findByText(/Recognized in this answer: 2/i)).toBeInTheDocument();
    await waitFor(() => expect(cta).toBeEnabled());
  });

  it('keeps total awareness metadata aligned with recognized awareness entries', async () => {
    const metaSpy = vi.fn();
    render(
      <RendererHarness
        question={spontaneousQuestion}
        initialFormData={{ selected_country: 'rwanda', c1_top_of_mind: 'KCB', c3_aware_banks: [] }}
        onMetaChangeSpy={metaSpy}
      />,
    );

    const textbox = screen.getByRole('textbox');
    fireEvent.focus(textbox);
    fireEvent.change(textbox, { target: { value: 'BK' } });

    await waitFor(() => {
      const latestPatch = metaSpy.mock.calls.at(-1)?.[0];
      expect(latestPatch?.c2_recognized_bank_ids).toEqual(['BK_RW']);
      expect(latestPatch?.c3_total_awareness).toEqual(expect.arrayContaining(['KCB_RW', 'BK_RW']));
    });
  });

  it('does not publish duplicate awareness metadata for unchanged recognition output', async () => {
    const metaSpy = vi.fn();
    render(
      <RendererHarness
        question={topOfMindQuestion}
        initialFormData={{ selected_country: 'rwanda' }}
        onMetaChangeSpy={metaSpy}
      />,
    );

    const textbox = screen.getByRole('textbox');
    fireEvent.focus(textbox);
    fireEvent.change(textbox, { target: { value: 'kcb' } });

    await waitFor(() => {
      expect(screen.getByText(/Matched: KCB/i)).toBeInTheDocument();
    });

    const callCountAfterFirstRecognition = metaSpy.mock.calls.length;
    fireEvent.change(textbox, { target: { value: 'kcb' } });

    await waitFor(() => {
      expect(metaSpy.mock.calls.length).toBe(callCountAfterFirstRecognition);
    });
  });

  it('resets the local awareness draft when the survey advances to the next awareness question', async () => {
    render(<QuestionSwitchHarness />);

    const textbox = screen.getByRole('textbox');
    fireEvent.focus(textbox);
    fireEvent.change(textbox, { target: { value: 'kcb' } });
    expect(await screen.findByText(/Matched: KCB/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next Question' }));

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('');
    });
    expect(screen.getByText(/Enter additional bank names separated by commas or new lines/i)).toBeInTheDocument();
  });
});
