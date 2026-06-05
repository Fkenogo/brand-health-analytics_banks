import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QuestionRenderer } from '@/components/survey/QuestionRenderer';

const radioQuestion = {
  id: 'b1_recency',
  type: 'radio',
  label: { en: 'Recency', rw: 'Recency', fr: 'Recency' },
  choices: [
    { value: 'this_week', label: { en: 'This week', rw: 'This week', fr: 'This week' } },
    { value: 'last_month', label: { en: 'Last month', rw: 'Last month', fr: 'Last month' } },
  ],
} as const;

const checkboxQuestion = {
  id: 'c3_aware_banks',
  type: 'checkbox',
  label: { en: 'Aware banks', rw: 'Aware banks', fr: 'Aware banks' },
  choices: [
    { value: 'kcb', label: { en: 'KCB', rw: 'KCB', fr: 'KCB' } },
    { value: 'dfcu', label: { en: 'DFCU', rw: 'DFCU', fr: 'DFCU' } },
  ],
} as const;

const matrixQuestion = {
  id: 'd3_relevance',
  type: 'rating-matrix',
  label: { en: 'Matrix', rw: 'Matrix', fr: 'Matrix' },
  choices: [
    { value: 'kcb', label: { en: 'KCB', rw: 'KCB', fr: 'KCB' } },
  ],
} as const;

describe('QuestionRenderer Uganda theme', () => {
  it('uses the yellow selected state for Uganda radio options only', () => {
    const onChange = () => undefined;
    const { rerender } = render(
      <QuestionRenderer
        question={radioQuestion as never}
        value="this_week"
        onChange={onChange}
        formData={{ selected_country: 'uganda' }}
        lang="en"
        themeColor="#000000"
      />,
    );

    expect(screen.getByRole('button', { name: /This week/i })).toHaveClass('bg-[#F5C542]', 'text-[#0B1A2B]');

    rerender(
      <QuestionRenderer
        question={radioQuestion as never}
        value="this_week"
        onChange={onChange}
        formData={{ selected_country: 'rwanda' }}
        lang="en"
        themeColor="#3B82F6"
      />,
    );

    expect(screen.getByRole('button', { name: /This week/i })).toHaveClass('bg-blue-600', 'text-white');
  });

  it('uses the yellow selected state for Uganda multi-select cards and dark checkmarks', () => {
    const onChange = () => undefined;
    render(
      <QuestionRenderer
        question={checkboxQuestion as never}
        value={['kcb']}
        onChange={onChange}
        formData={{ selected_country: 'uganda', c1_top_of_mind: '', c2_spontaneous: '' }}
        lang="en"
        themeColor="#000000"
      />,
    );

    expect(screen.getByRole('button', { name: /KCB/i })).toHaveClass('bg-[#F5C542]', 'text-[#0B1A2B]');
    expect(screen.getByRole('button', { name: /DFCU/i })).toHaveClass('border-slate-300/45');
  });

  it('uses the yellow selected state for Uganda matrix ratings', () => {
    const Wrapper = () => {
      const [value, setValue] = React.useState<Record<string, number | undefined>>({});
      return (
        <QuestionRenderer
          question={matrixQuestion as never}
          value={value}
          onChange={(next) => setValue(next as Record<string, number | undefined>)}
          formData={{ selected_country: 'uganda' }}
          lang="en"
          themeColor="#000000"
        />
      );
    };

    render(<Wrapper />);
    const ratingButtons = screen.getAllByRole('button').filter((button) => button.className.includes('rounded-full'));
    fireEvent.click(ratingButtons[3]);
    expect(ratingButtons[3]).toHaveClass('bg-[#F5C542]', 'text-[#0B1A2B]');
  });
});
