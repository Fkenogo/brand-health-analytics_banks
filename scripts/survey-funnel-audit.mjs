import fs from 'node:fs/promises';

const args = process.argv.slice(2);

const getArg = (flag, fallback = '') => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};

const responsesPath = getArg('--responses', 'testing/sample-responses.seed.json');
const eventsPath = getArg('--events', '');

const readJson = async (filePath) => {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
};

const responses = await readJson(responsesPath);
const events = eventsPath ? await readJson(eventsPath) : [];

const countAnswered = (response, field) => {
  const value = String(response?.[field] || '').trim();
  return value.length > 0 && value !== 'prefer_not_to_say';
};

const summarizeFromResponsesOnly = () => {
  const questionTimingTotals = new Map();
  const questionTimingCounts = new Map();

  responses.forEach((response) => {
    Object.entries(response.question_timings || {}).forEach(([questionId, seconds]) => {
      if (!Number.isFinite(Number(seconds))) return;
      questionTimingTotals.set(questionId, Number(questionTimingTotals.get(questionId) || 0) + Number(seconds));
      questionTimingCounts.set(questionId, Number(questionTimingCounts.get(questionId) || 0) + 1);
    });
  });

  const averageTimePerQuestion = Array.from(questionTimingTotals.keys()).map((questionId) => ({
    question_id: questionId,
    average_elapsed_seconds: Number(questionTimingTotals.get(questionId) || 0) / Number(questionTimingCounts.get(questionId) || 1),
  })).sort((left, right) => right.average_elapsed_seconds - left.average_elapsed_seconds);

  const demographicCompletion = ['b2_age', 'e1_employment', 'e2_education', 'e3_gender'].map((field) => ({
    field,
    answered: responses.filter((response) => countAnswered(response, field)).length,
    prefer_not_to_say: responses.filter((response) => String(response?.[field] || '').trim() === 'prefer_not_to_say').length,
    completion_rate: responses.length > 0 ? responses.filter((response) => countAnswered(response, field)).length / responses.length : 0,
  }));

  return {
    total_starts: null,
    total_submissions: responses.length,
    completion_rate: null,
    drop_off_by_question: [],
    average_time_per_question: averageTimePerQuestion,
    skip_rate_by_question: [],
    demographic_completion: demographicCompletion,
    problematic_questions: averageTimePerQuestion.filter((row) => row.average_elapsed_seconds >= 18),
    data_limitations: [
      'No session-event export supplied, so start counts and question-level drop-off cannot be measured from response data alone.',
      'Skip rates are unavailable from response-only data unless explicit skip events have been collected.',
    ],
  };
};

const summarizeFromEvents = () => {
  const viewedByQuestion = new Map();
  const skippedByQuestion = new Map();
  const droppedByQuestion = new Map();
  const elapsedByQuestion = new Map();
  const sessions = new Map();

  events.forEach((event) => {
    const sessionId = String(event.sessionId || '').trim();
    if (sessionId) {
      const existingSession = sessions.get(sessionId) || {};
      sessions.set(sessionId, {
        ...existingSession,
        ...event,
      });
    }

    const questionId = String(event.questionId || '').trim();
    if (!questionId) return;

    if (event.eventType === 'question_viewed') {
      viewedByQuestion.set(questionId, Number(viewedByQuestion.get(questionId) || 0) + 1);
    }
    if (event.eventType === 'question_skipped') {
      skippedByQuestion.set(questionId, Number(skippedByQuestion.get(questionId) || 0) + 1);
    }
    if (event.eventType === 'survey_abandoned') {
      droppedByQuestion.set(questionId, Number(droppedByQuestion.get(questionId) || 0) + 1);
    }
    if ((event.eventType === 'question_answered' || event.eventType === 'question_skipped') && Number.isFinite(Number(event.elapsedSeconds))) {
      const values = elapsedByQuestion.get(questionId) || [];
      values.push(Number(event.elapsedSeconds));
      elapsedByQuestion.set(questionId, values);
    }
  });

  const totalStarts = events.filter((event) => event.eventType === 'survey_session_started').length;
  const totalSubmissions = events.filter((event) => event.eventType === 'survey_submitted').length;
  const questionIds = Array.from(new Set([
    ...viewedByQuestion.keys(),
    ...skippedByQuestion.keys(),
    ...droppedByQuestion.keys(),
    ...elapsedByQuestion.keys(),
  ]));

  const rows = questionIds.map((questionId) => {
    const viewed = Number(viewedByQuestion.get(questionId) || 0);
    const skipped = Number(skippedByQuestion.get(questionId) || 0);
    const dropped = Number(droppedByQuestion.get(questionId) || 0);
    const elapsed = elapsedByQuestion.get(questionId) || [];
    return {
      question_id: questionId,
      viewed,
      skipped,
      dropped,
      drop_off_rate: viewed > 0 ? dropped / viewed : 0,
      skip_rate: viewed > 0 ? skipped / viewed : 0,
      average_elapsed_seconds: elapsed.length > 0 ? elapsed.reduce((sum, value) => sum + value, 0) / elapsed.length : 0,
    };
  }).sort((left, right) => right.drop_off_rate - left.drop_off_rate);

  return {
    total_starts: totalStarts,
    total_submissions: totalSubmissions,
    completion_rate: totalStarts > 0 ? totalSubmissions / totalStarts : 0,
    drop_off_by_question: rows.map((row) => ({
      question_id: row.question_id,
      viewed: row.viewed,
      dropped: row.dropped,
      drop_off_rate: row.drop_off_rate,
    })),
    average_time_per_question: rows.map((row) => ({
      question_id: row.question_id,
      average_elapsed_seconds: row.average_elapsed_seconds,
    })),
    skip_rate_by_question: rows.map((row) => ({
      question_id: row.question_id,
      viewed: row.viewed,
      skipped: row.skipped,
      skip_rate: row.skip_rate,
    })),
    demographic_completion: ['b2_age', 'e1_employment', 'e2_education', 'e3_gender'].map((field) => ({
      field,
      answered: responses.filter((response) => countAnswered(response, field)).length,
      prefer_not_to_say: responses.filter((response) => String(response?.[field] || '').trim() === 'prefer_not_to_say').length,
      completion_rate: responses.length > 0 ? responses.filter((response) => countAnswered(response, field)).length / responses.length : 0,
    })),
    problematic_questions: rows.filter((row) => row.drop_off_rate >= 0.2 || row.skip_rate >= 0.2 || row.average_elapsed_seconds >= 30),
  };
};

const summary = events.length > 0 ? summarizeFromEvents() : summarizeFromResponsesOnly();
console.log(JSON.stringify(summary, null, 2));
