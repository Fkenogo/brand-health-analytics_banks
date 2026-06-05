import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AppRoutes } from '@/App';
import { SURVEY_QUESTIONS } from '@/constants';

const mocks = vi.hoisted(() => ({
  activeQuestionnaireMock: null as { questions: unknown[] } | null,
  authStateMock: {
    isLoading: false,
    isAuthenticated: false,
    user: null as null | { role: 'admin' | 'subscriber' | 'respondent'; hasAdminClaim?: boolean },
  },
  storedResponsesMock: [] as Array<Record<string, unknown>>,
  canSubmitSurveyMock: { canSubmit: true as boolean, nextAllowedDate: undefined as Date | undefined },
  recordSubmissionMock: vi.fn(),
  trackSurveyEventMock: vi.fn(),
  getActiveSessionMock: vi.fn(() => null),
  persistActiveSessionMock: vi.fn(),
  clearActiveSessionMock: vi.fn(),
  updateLastSeenMock: vi.fn(),
}));

vi.mock('@/auth/context', async () => {
  const actual = await vi.importActual<typeof import('@/auth/context')>('@/auth/context');
  return {
    ...actual,
    useAuth: () => ({
      state: mocks.authStateMock,
    }),
  };
});

vi.mock('@/services/questionnaireService', () => ({
  questionnaireService: {
    getActive: vi.fn(async () => {
      if (!mocks.activeQuestionnaireMock) return null;
      const actual = await vi.importActual<typeof import('@/services/questionnaireService')>('@/services/questionnaireService');
      return {
        ...mocks.activeQuestionnaireMock,
        questions: actual.hydrateRuntimeQuestionnaireQuestions(mocks.activeQuestionnaireMock.questions as never[]),
      };
    }),
    getByWaveTag: vi.fn(async () => null),
  },
}));

vi.mock('@/auth/utils', () => ({
  getDeviceFingerprint: () => 'test-device',
  respondentPanel: {
    canSubmitSurvey: () => mocks.canSubmitSurveyMock,
    recordSubmission: mocks.recordSubmissionMock,
  },
  PANEL_CONFIG: {
    COOLDOWN_DAYS: 90,
    INCENTIVE_POINTS_PER_SURVEY: 10,
    MAX_POINTS_PER_MONTH: 100,
  },
}));

vi.mock('@/utils/storage', () => ({
  getResponses: () => mocks.storedResponsesMock,
  saveResponse: vi.fn(),
}));

vi.mock('@/services/responseService', () => ({
  responseService: {
    submitPublicResponse: vi.fn(async () => ({ ok: true })),
    submitPublicFollowUpContact: vi.fn(async () => ({ ok: true })),
    listResponses: vi.fn(async () => []),
  },
}));

vi.mock('@/services/surveyTelemetryService', () => ({
  surveyTelemetryService: {
    track: mocks.trackSurveyEventMock,
    getActiveSession: mocks.getActiveSessionMock,
    persistActiveSession: mocks.persistActiveSessionMock,
    clearActiveSession: mocks.clearActiveSessionMock,
    updateLastSeen: mocks.updateLastSeenMock,
  },
}));

describe('survey country routes', () => {
  it('lets trusted admins open /survey instead of redirecting away', () => {
    mocks.authStateMock = {
      isLoading: false,
      isAuthenticated: true,
      user: { role: 'admin', hasAdminClaim: true },
    };

    render(
      <MemoryRouter initialEntries={['/survey']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText('Choose your country to begin')).toBeInTheDocument();
    mocks.authStateMock = { isLoading: false, isAuthenticated: false, user: null };
  });

  it('lets trusted admins open all country survey routes directly', async () => {
    mocks.authStateMock = {
      isLoading: false,
      isAuthenticated: true,
      user: { role: 'admin', hasAdminClaim: true },
    };

    for (const [route, heading] of [
      ['/survey/rwanda', /Banking Feedback Rwanda/i],
      ['/survey/uganda', /Banking Feedback Uganda/i],
      ['/survey/burundi', /Banking Feedback Burundi/i],
    ] as const) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[route]}>
          <AppRoutes />
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(screen.getByText(heading)).toBeInTheDocument();
      });
      unmount();
    }

    mocks.authStateMock = { isLoading: false, isAuthenticated: false, user: null };
  });

  it('lets trusted admins bypass local survey cooldown locks while anonymous users stay restricted', () => {
    mocks.storedResponsesMock = [
      {
        device_id: 'test-device',
        country: 'rwanda',
        selected_country: 'rwanda',
        _status: 'completed',
      },
    ];
    mocks.canSubmitSurveyMock = { canSubmit: false, nextAllowedDate: new Date('2026-06-01T00:00:00.000Z') };

    const anonymous = render(
      <MemoryRouter initialEntries={['/survey/rwanda']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: /Begin Questionnaire/i })).toBeDisabled();
    expect(screen.getByText(/Thank you for your feedback\. You can take this survey again after/i)).toBeInTheDocument();
    expect(screen.queryByText(/Thanks for joining the panel/i)).not.toBeInTheDocument();
    anonymous.unmount();

    mocks.authStateMock = {
      isLoading: false,
      isAuthenticated: true,
      user: { role: 'admin', hasAdminClaim: true },
    };

    render(
      <MemoryRouter initialEntries={['/survey/rwanda']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: /Begin Questionnaire/i })).not.toBeDisabled();

    mocks.authStateMock = { isLoading: false, isAuthenticated: false, user: null };
    mocks.storedResponsesMock = [];
    mocks.canSubmitSurveyMock = { canSubmit: true, nextAllowedDate: undefined };
  });

  it('hydrates runtime screening logic even when the active questionnaire comes from Firestore without functions', async () => {
    mocks.authStateMock = { isLoading: false, isAuthenticated: false, user: null };
    mocks.activeQuestionnaireMock = {
      questions: JSON.parse(JSON.stringify(SURVEY_QUESTIONS)),
    };

    render(
      <MemoryRouter initialEntries={['/survey/rwanda']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Begin Questionnaire/i }));

    await waitFor(() => {
      expect(screen.getByText(/When was the last time you used a commercial bank/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^This week$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Which of the following age categories do you fall in/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/targeting recent banking users/i)).not.toBeInTheDocument();
    mocks.activeQuestionnaireMock = null;
  });

  it('treats recency disqualification as a terminal path without normal final validation', async () => {
    mocks.authStateMock = { isLoading: false, isAuthenticated: false, user: null };
    mocks.activeQuestionnaireMock = {
      questions: JSON.parse(JSON.stringify(SURVEY_QUESTIONS)),
    };

    render(
      <MemoryRouter initialEntries={['/survey/rwanda']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Begin Questionnaire/i }));

    await waitFor(() => {
      expect(screen.getByText(/When was the last time you used a commercial bank/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Longer than 3 months$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/targeting recent banking users/i).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: /Finish/i }));

    await waitFor(() => {
      expect(screen.getByText(/Thank you for your feedback/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Missing: b2_age/i)).not.toBeInTheDocument();
    mocks.activeQuestionnaireMock = null;
  });

  it('starts direct Rwanda links at the first real research question after intro consent', async () => {
    mocks.activeQuestionnaireMock = null;
    render(
      <MemoryRouter initialEntries={['/survey/rwanda']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Begin Questionnaire/i }));

    await waitFor(() => {
      expect(screen.getByText(/When was the last time you used a commercial bank/i)).toBeInTheDocument();
    });

    expect(screen.queryByText('Welcome to Banking Insights')).not.toBeInTheDocument();
    expect(screen.queryByText(/Which country are you responding from/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Would you like to participate/i)).not.toBeInTheDocument();
  });

  it('preselects country and shows the country-specific intro on direct country survey routes', () => {
    mocks.activeQuestionnaireMock = null;
    render(
      <MemoryRouter initialEntries={['/survey/rwanda']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText('Banking Feedback Rwanda')).toBeInTheDocument();
    expect(screen.getByText('Begin Questionnaire')).toBeInTheDocument();
    expect(screen.getByText(/participating voluntarily/i)).toBeInTheDocument();
    expect(screen.queryByText('Choose your country to begin')).not.toBeInTheDocument();
  });

  it('redirects invalid country links back to the general survey entry', () => {
    mocks.activeQuestionnaireMock = null;
    render(
      <MemoryRouter initialEntries={['/survey/kenya']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText('Choose your country to begin')).toBeInTheDocument();
    expect(screen.getByText(/Select the country that applies to you first/i)).toBeInTheDocument();
  });

  it('keeps generic /survey on the country selection entry screen', () => {
    mocks.activeQuestionnaireMock = null;
    render(
      <MemoryRouter initialEntries={['/survey']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText('Choose your country to begin')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Rwanda/i })).toHaveAttribute('href', '/survey/start/rwanda');
    expect(screen.getByRole('link', { name: /Uganda/i })).toHaveAttribute('href', '/survey/start/uganda');
    expect(screen.getByRole('link', { name: /Burundi/i })).toHaveAttribute('href', '/survey/start/burundi');
  });

  it('starts the generic Rwanda flow at the first real research question after country selection and intro consent', async () => {
    mocks.activeQuestionnaireMock = null;
    render(
      <MemoryRouter initialEntries={['/survey']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: /Rwanda/i }));

    await waitFor(() => {
      expect(screen.getByText('Banking Feedback Rwanda')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Begin Questionnaire/i }));

    await waitFor(() => {
      expect(screen.getByText(/When was the last time you used a commercial bank/i)).toBeInTheDocument();
    });

    expect(screen.queryByText('Welcome to Banking Insights')).not.toBeInTheDocument();
    expect(screen.queryByText(/Which country are you responding from/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Would you like to participate/i)).not.toBeInTheDocument();
  });

  it('lets respondents continue immediately after entering a recognized Q1 bank without a stale loading state', async () => {
    mocks.activeQuestionnaireMock = null;
    render(
      <MemoryRouter initialEntries={['/survey/rwanda']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Begin Questionnaire/i }));

    await waitFor(() => {
      expect(screen.getByText(/When was the last time you used a commercial bank/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^This week$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    fireEvent.click(screen.getByRole('button', { name: /^25-34$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'KCB' } });

    expect(screen.getByText(/Matched: KCB/i)).toBeInTheDocument();
    expect(screen.queryByText(/Recognizing bank names/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/Which other banks from your country come to your mind/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Already captured/i)).toBeInTheDocument();
  });

  it('shows inline consent validation instead of leaving begin feeling broken', async () => {
    mocks.activeQuestionnaireMock = null;
    render(
      <MemoryRouter initialEntries={['/survey/rwanda']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Begin Questionnaire/i }));

    expect(screen.getByText(/Please confirm your consent to continue/i)).toBeInTheDocument();
    expect(screen.getByText(/Please tick the box below to begin/i)).toBeInTheDocument();
  });

  it('shows the age question after recency and blocks progression until it is answered', async () => {
    mocks.activeQuestionnaireMock = null;
    render(
      <MemoryRouter initialEntries={['/survey/rwanda']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Begin Questionnaire/i }));

    await waitFor(() => {
      expect(screen.getByText(/When was the last time you used a commercial bank/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^This week$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Which of the following age categories do you fall in/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Complete Survey/i })).toBeDisabled();
    expect(screen.queryByText(/This survey is for respondents 18 years and older/i)).not.toBeInTheDocument();
  }, 15000);

  it('terminates only when the respondent explicitly answers below 18', async () => {
    mocks.activeQuestionnaireMock = null;
    render(
      <MemoryRouter initialEntries={['/survey/rwanda']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Begin Questionnaire/i }));

    await waitFor(() => {
      expect(screen.getByText(/When was the last time you used a commercial bank/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^This week$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Which of the following age categories do you fall in/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Below 18$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/This survey is for respondents 18 years and older/i).length).toBeGreaterThan(0);
    });
  }, 15000);

  it('continues normally when the respondent answers 18 or older', async () => {
    mocks.activeQuestionnaireMock = null;
    render(
      <MemoryRouter initialEntries={['/survey/rwanda']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Begin Questionnaire/i }));

    await waitFor(() => {
      expect(screen.getByText(/When was the last time you used a commercial bank/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^This week$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Which of the following age categories do you fall in/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^25-34$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Which bank from your country comes to your mind FIRST/i)).toBeInTheDocument();
    });
  }, 15000);

  it('redirects /survey/start back to the generic country selection entry', () => {
    mocks.activeQuestionnaireMock = null;
    render(
      <MemoryRouter initialEntries={['/survey/start']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText('Choose your country to begin')).toBeInTheDocument();
  });
});
