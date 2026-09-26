"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  HardDriveDownload,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { RohaMark } from "@/components/brand/logo";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Label, Select, Textarea } from "@/components/ui/form";
import { numberWord } from "@/lib/text";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import type { SurveyDefinition, SurveyQuestion } from "@/lib/survey/load";
import { checkParticipation, submitSurvey, verifyAccessCode, type SubmissionInput } from "@/app/s/[token]/actions";

type Rating = number | "NA" | null;
interface Answer {
  current: Rating;
  desired: Rating;
}
interface Profile {
  department_option_id: string | null;
  location_option_id: string | null;
  level_option_id: string | null;
  tenure_range: string | null;
}
interface SavedState {
  v: 1;
  step: number;
  consent: boolean;
  participant: string | null;
  mode: "session" | "access_code";
  profile: Profile;
  answers: Record<string, Answer>;
  comments: Record<string, string>;
  consentToQuote: boolean;
  submitted: boolean;
}

const SCALE = [
  { value: 1, label: "Strongly disagree", short: "SD" },
  { value: 2, label: "Disagree", short: "D" },
  { value: 3, label: "Neither agree nor disagree", short: "N" },
  { value: 4, label: "Agree", short: "A" },
  { value: 5, label: "Strongly agree", short: "SA" },
];

const EMPTY_PROFILE: Profile = { department_option_id: null, location_option_id: null, level_option_id: null, tenure_range: null };

function randomParticipantToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function storageKey(token: string) {
  return `roha:survey:${token}`;
}

type Step =
  | { kind: "welcome" }
  | { kind: "profile" }
  | { kind: "section"; index: number }
  | { kind: "feedback" }
  | { kind: "review" };

export function SurveyApp({ survey, preview = false }: { survey: SurveyDefinition; preview?: boolean }) {
  const hasProfile =
    survey.privacyMode === "confidential" &&
    (survey.profileOptions.departments.length > 0 ||
      survey.profileOptions.locations.length > 0 ||
      survey.profileOptions.levels.length > 0 ||
      survey.profileOptions.tenure.length > 0);

  const steps: Step[] = useMemo(
    () => [
      { kind: "welcome" },
      ...(hasProfile ? [{ kind: "profile" } as Step] : []),
      ...survey.sections.map((_, index) => ({ kind: "section", index }) as Step),
      { kind: "feedback" },
      { kind: "review" },
    ],
    [hasProfile, survey.sections],
  );

  const [state, setState] = useState<SavedState>({
    v: 1,
    step: 0,
    consent: false,
    participant: null,
    mode: survey.requireAccessCode ? "access_code" : "session",
    profile: EMPTY_PROFILE,
    answers: {},
    comments: {},
    consentToQuote: false,
    submitted: false,
  });
  const [loaded, setLoaded] = useState(preview);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<Set<string>>(new Set());
  const [codeInput, setCodeInput] = useState("");
  const [pending, startTransition] = useTransition();
  const topRef = useRef<HTMLDivElement>(null);

  // Restore from this device's storage (answers never leave the browser until submission).
  useEffect(() => {
    if (preview) return;
    let saved: SavedState | null = null;
    try {
      const raw = localStorage.getItem(storageKey(survey.surveyToken));
      if (raw) saved = JSON.parse(raw) as SavedState;
    } catch {
      saved = null;
    }
    // Hydrating from localStorage (an external store) after mount avoids SSR mismatches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved && saved.v === 1) setState({ ...saved, step: Math.min(saved.step, steps.length - 1) });
    setLoaded(true);
    if (saved?.submitted) {
      setAlreadySubmitted(true);
    } else if (saved?.participant && saved.mode === "session") {
      checkParticipation(survey.surveyToken, saved.participant).then((status) => {
        if (status === "submitted") setAlreadySubmitted(true);
      });
    }
  }, [preview, steps.length, survey.surveyToken]);

  // Autosave on every change.
  useEffect(() => {
    if (!loaded || preview) return;
    try {
      localStorage.setItem(storageKey(survey.surveyToken), JSON.stringify(state));
    } catch {
      /* storage may be unavailable (private mode) — the survey still works */
    }
  }, [state, loaded, preview, survey.surveyToken]);

  const step = steps[state.step];
  const sectionSteps = steps.filter((s) => s.kind === "section").length;
  const progress = Math.round((state.step / (steps.length - 1)) * 100);

  const goTo = useCallback((index: number) => {
    setState((s) => ({ ...s, step: index }));
    setMissing(new Set());
    setError(null);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  const setAnswer = (questionId: string, perspective: "current" | "desired", value: Rating) => {
    setState((s) => ({
      ...s,
      answers: { ...s.answers, [questionId]: { ...(s.answers[questionId] ?? { current: null, desired: null }), [perspective]: value } },
    }));
    setMissing((m) => {
      if (!m.has(`${questionId}:${perspective}`)) return m;
      const next = new Set(m);
      next.delete(`${questionId}:${perspective}`);
      return next;
    });
  };

  const unanswered = (questions: SurveyQuestion[]) => {
    const out = new Set<string>();
    for (const q of questions) {
      const a = state.answers[q.id];
      if (!a || a.current === null || a.current === undefined) out.add(`${q.id}:current`);
      if (!a || a.desired === null || a.desired === undefined) out.add(`${q.id}:desired`);
    }
    return out;
  };

  const next = () => {
    setError(null);
    if (step.kind === "welcome") {
      if (!state.consent) {
        setError("Please confirm that you have read the information above and agree to participate.");
        return;
      }
      if (survey.requireAccessCode && !preview) {
        startTransition(async () => {
          const res = await verifyAccessCode(survey.surveyToken, codeInput || state.participant || "");
          if (!res.ok) {
            setError(res.error);
            return;
          }
          setState((s) => ({ ...s, participant: res.code, mode: "access_code" }));
          goTo(state.step + 1);
        });
        return;
      }
      if (!state.participant) setState((s) => ({ ...s, participant: randomParticipantToken(), mode: "session" }));
    }
    if (step.kind === "section") {
      const miss = unanswered(survey.sections[step.index].questions);
      if (miss.size > 0) {
        setMissing(miss);
        setError(`Please answer both the current and desired state for every statement (${miss.size} ${miss.size === 1 ? "answer is" : "answers are"} missing).`);
        const first = [...miss][0].split(":")[0];
        document.getElementById(`q-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    goTo(Math.min(state.step + 1, steps.length - 1));
  };

  const back = () => goTo(Math.max(0, state.step - 1));

  const clearDevice = () => {
    try {
      localStorage.removeItem(storageKey(survey.surveyToken));
    } catch {
      /* ignore */
    }
    setState({
      v: 1,
      step: 0,
      consent: false,
      participant: null,
      mode: survey.requireAccessCode ? "access_code" : "session",
      profile: EMPTY_PROFILE,
      answers: {},
      comments: {},
      consentToQuote: false,
      submitted: false,
    });
    setCodeInput("");
    setMissing(new Set());
    setError(null);
  };

  const submit = () => {
    setError(null);
    if (preview) {
      setError("Preview mode — responses are not submitted.");
      return;
    }
    const allQuestions = survey.sections.flatMap((s) => s.questions);
    const miss = unanswered(allQuestions);
    if (miss.size > 0) {
      const firstSection = survey.sections.findIndex((s) => s.questions.some((q) => miss.has(`${q.id}:current`) || miss.has(`${q.id}:desired`)));
      setError("Some statements are not answered yet. Taking you to the first one.");
      goTo(steps.findIndex((s) => s.kind === "section" && s.index === firstSection));
      setMissing(miss);
      return;
    }
    startTransition(async () => {
      const participant = state.participant ?? randomParticipantToken();
      const res = await submitSurvey({
        surveyToken: survey.surveyToken,
        participant,
        mode: state.mode,
        profile: survey.privacyMode === "confidential" ? (state.profile as SubmissionInput["profile"]) : {},
        items: allQuestions.map((q) => {
          const a = state.answers[q.id];
          return {
            question_id: q.id,
            current: typeof a.current === "number" ? a.current : null,
            current_na: a.current === "NA",
            desired: typeof a.desired === "number" ? a.desired : null,
            desired_na: a.desired === "NA",
          };
        }),
        comments: survey.qualitative
          .map((q) => ({ qualitative_question_id: q.id, body: (state.comments[q.key] ?? "").trim(), consent_to_quote: state.consentToQuote }))
          .filter((c) => c.body.length > 0),
      });
      if (res.ok || res.code === "ROHA_DUPLICATE") {
        // Remove the answers from this device; keep only a "submitted" marker.
        const marker: SavedState = {
          v: 1,
          step: 0,
          consent: false,
          participant: state.mode === "session" ? participant : null,
          mode: state.mode,
          profile: EMPTY_PROFILE,
          answers: {},
          comments: {},
          consentToQuote: false,
          submitted: true,
        };
        try {
          localStorage.setItem(storageKey(survey.surveyToken), JSON.stringify(marker));
        } catch {
          /* ignore */
        }
        setState(marker);
        if (res.ok) setDone(true);
        else setAlreadySubmitted(true);
        return;
      }
      setError(res.error);
    });
  };

  if (!loaded) {
    return (
      <Shell survey={survey} preview={preview}>
        <div className="flex justify-center py-24 text-muted">
          <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />
        </div>
      </Shell>
    );
  }

  if (done || alreadySubmitted) {
    return (
      <Shell survey={survey} preview={preview}>
        <div className="mx-auto max-w-2xl py-10 text-center animate-fade-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" aria-hidden />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-navy-900">{done ? "Thank you for sharing your perspective" : "You have already responded"}</h1>
          <p className="mt-4 leading-relaxed text-muted">
            {done
              ? `Your response to the ${survey.campaignName} has been submitted. When the assessment closes, ${survey.organizationName}'s leadership will receive aggregated results — never individual answers — for groups of at least five people.`
              : "Our records show that a response has already been submitted from this browser or with this access code. Each person may respond once. Thank you for participating."}
          </p>
          <p className="mt-6 text-sm text-muted">Your answers have been removed from this device. You may now close this window.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell survey={survey} preview={preview}>
      <div ref={topRef} className="scroll-mt-4" />
      {step.kind !== "welcome" ? (
        <ProgressHeader
          label={
            step.kind === "profile"
              ? "About you (optional)"
              : step.kind === "section"
                ? `Section ${step.index + 1} of ${sectionSteps}`
                : step.kind === "feedback"
                  ? "Additional feedback (optional)"
                  : "Review your answers"
          }
          progress={progress}
        />
      ) : null}

      <div className="animate-fade-in" key={state.step}>
        {step.kind === "welcome" ? (
          <Welcome
            survey={survey}
            consent={state.consent}
            onConsent={(consent) => setState((s) => ({ ...s, consent }))}
            codeInput={codeInput || (state.mode === "access_code" ? state.participant ?? "" : "")}
            onCode={setCodeInput}
            preview={preview}
          />
        ) : null}
        {step.kind === "profile" ? <ProfileStep survey={survey} profile={state.profile} onChange={(profile) => setState((s) => ({ ...s, profile }))} /> : null}
        {step.kind === "section" ? (
          <SectionStep
            survey={survey}
            index={step.index}
            answers={state.answers}
            missing={missing}
            onAnswer={setAnswer}
          />
        ) : null}
        {step.kind === "feedback" ? (
          <FeedbackStep
            survey={survey}
            comments={state.comments}
            consentToQuote={state.consentToQuote}
            onComment={(key, value) => setState((s) => ({ ...s, comments: { ...s.comments, [key]: value } }))}
            onConsent={(consentToQuote) => setState((s) => ({ ...s, consentToQuote }))}
          />
        ) : null}
        {step.kind === "review" ? (
          <ReviewStep survey={survey} state={state} onEdit={(stepIndex) => goTo(stepIndex)} steps={steps} />
        ) : null}
      </div>

      {error ? (
        <div className="mt-6">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      <div className="sticky bottom-0 -mx-4 mt-8 border-t border-line bg-white/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <div className="flex items-center justify-between gap-3">
          {state.step > 0 ? (
            <Button variant="outline" onClick={back} disabled={pending}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <span />
          )}
          {step.kind === "review" ? (
            <Button size="lg" onClick={submit} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {pending ? "Submitting…" : "Submit my response"}
            </Button>
          ) : (
            <Button size="lg" onClick={next} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {step.kind === "welcome" ? "Begin assessment" : "Continue"} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {!preview && state.step > 0 ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <HardDriveDownload className="h-3.5 w-3.5" aria-hidden /> Progress is saved only in this browser until you submit.
          </span>
          <button type="button" onClick={clearDevice} className="inline-flex items-center gap-1 underline hover:text-navy-800">
            <Trash2 className="h-3.5 w-3.5" aria-hidden /> Clear my answers from this device
          </button>
        </div>
      ) : null}
    </Shell>
  );
}

function Shell({ survey, preview, children }: { survey: SurveyDefinition; preview: boolean; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      {preview ? (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
          Preview mode — this is how employees will see the survey. Responses cannot be submitted from a preview.
        </div>
      ) : null}
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <RohaMark className="h-7 w-7" />
            <div className="leading-tight">
              <p className="font-serif text-base font-bold tracking-[0.12em] text-navy-900">ROHA</p>
              <p className="hidden text-[10px] uppercase tracking-[0.14em] text-muted sm:block">{BRAND.productFull}</p>
            </div>
          </div>
          <p className="max-w-[45%] truncate text-right text-xs text-muted" title={survey.organizationName}>
            {survey.organizationName}
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">{children}</main>
      <footer className="mx-auto max-w-3xl px-4 pb-10 text-center text-[11px] text-muted">
        ROHA is provided by {BRAND.company}. Your organization is responsible for this assessment.
      </footer>
    </div>
  );
}

function ProgressHeader({ label, progress }: { label: string; progress: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-xs font-medium text-muted">
        <span>{label}</span>
        <span className="tabular-nums">{progress}% complete</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy-100" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function Welcome({
  survey,
  consent,
  onConsent,
  codeInput,
  onCode,
  preview,
}: {
  survey: SurveyDefinition;
  consent: boolean;
  onConsent: (v: boolean) => void;
  codeInput: string;
  onCode: (v: string) => void;
  preview: boolean;
}) {
  const statementCount = survey.sections.reduce((n, sec) => n + sec.questions.length, 0);
  const anonymous = survey.privacyMode === "anonymous";
  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-navy-900 px-6 py-8 text-white shadow-elevated sm:px-10 sm:py-10">
        <p className="font-serif text-4xl font-bold tracking-[0.12em]">ROHA</p>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-navy-200">{BRAND.productFull}</p>
        <p className="mt-6 font-serif text-2xl leading-snug text-white sm:text-3xl">&ldquo;{BRAND.surveyWelcome}&rdquo;</p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-100">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-emerald-400" aria-hidden /> About 10–15 minutes
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden /> {anonymous ? "Anonymous — no demographics collected" : "Confidential"}
          </span>
        </div>
      </div>

      <section className="space-y-3">
        <h1 className="text-2xl font-semibold text-navy-900">{survey.campaignName}</h1>
        <p className="text-sm text-muted">Conducted by {survey.organizationName}</p>
        {survey.description ? <p className="leading-relaxed text-navy-800">{survey.description}</p> : null}
        <p className="leading-relaxed text-navy-800">
          This assessment asks for your perspective on how the organization operates across {numberWord(survey.sections.length)} areas:{" "}
          {listNames(survey.sections.map((sec) => sec.name))}. For each of {statementCount} statements you will give two ratings: how
          things are <strong>today</strong>, and how you believe they <strong>should be</strong> in the future. There are no right or
          wrong answers — your honest view is what matters.
        </p>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-sans text-base font-semibold text-navy-900">
          <Lock className="h-4 w-4 text-emerald-600" aria-hidden /> How your responses are handled
        </h2>
        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-navy-800">
          <li>• Participation is voluntary. You will not be asked for your name, email address or employee ID, and you do not need an account.</li>
          <li>• ROHA does not store your IP address or the time you submit alongside your answers, and your organization cannot view individual responses.</li>
          <li>• Leadership sees only aggregated results, and only for groups of at least five respondents. Results are released after the assessment closes.</li>
          {anonymous ? (
            <li>• This is an <strong>anonymous</strong> assessment: no demographic information (department, location, level or tenure) is collected.</li>
          ) : (
            <li>
              • This is a <strong>confidential</strong> assessment, not an anonymous one: you may optionally tell us your department,
              location, level and tenure so results can be compared across groups. Every one of those questions can be skipped.
            </li>
          )}
          <li>
            • Written comments are optional. Direct identifiers (such as emails or phone numbers) are removed automatically, and comments
            may be analyzed with an AI service to identify common themes. A comment is shown word-for-word to leadership only if you give permission.
          </li>
          <li>
            • Limitations: {BRAND.company} operates the ROHA platform, and its authorized administrators could technically access stored
            response records, which are protected by strict access controls. Details you choose to write in comments could identify you, so
            please avoid including them.
          </li>
          <li>• Your in-progress answers are saved only in this browser until you submit. On a shared device, use &ldquo;Clear my answers&rdquo; if you stop part-way.</li>
        </ul>
      </section>

      {survey.requireAccessCode ? (
        <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
          <Label htmlFor="access-code" className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-emerald-600" aria-hidden /> Access code
          </Label>
          <p className="mt-1 text-sm text-muted">Enter the single-use code you received. The code is used only to prevent duplicate responses and is never linked to your answers.</p>
          <Input
            id="access-code"
            className="mt-3 max-w-xs font-mono uppercase tracking-widest"
            placeholder="XXXX-XXXX-XXXX"
            value={codeInput}
            onChange={(e) => onCode(e.target.value)}
            autoComplete="off"
            disabled={preview}
          />
        </section>
      ) : null}

      <label className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-navy-900">
        <Checkbox checked={consent} onChange={(e) => onConsent(e.target.checked)} className="mt-0.5 h-5 w-5" />
        <span>
          <strong>I have read the information above and I agree to participate.</strong> I understand that participation is
          voluntary, that I may stop at any time before submitting, and how my responses will be used.
        </span>
      </label>
    </div>
  );
}

function ProfileStep({ survey, profile, onChange }: { survey: SurveyDefinition; profile: Profile; onChange: (p: Profile) => void }) {
  const o = survey.profileOptions;
  const field = (id: keyof Profile, label: string, options: { value: string; label: string }[]) =>
    options.length > 0 ? (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Select id={id} value={profile[id] ?? ""} onChange={(e) => onChange({ ...profile, [id]: e.target.value || null })}>
          <option value="">Prefer not to say</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>
    ) : null;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-navy-900">About you</h2>
        <p className="mt-2 leading-relaxed text-muted">
          These questions are optional. They allow results to be compared across groups — but any group with fewer than five
          respondents is never shown. Choose &ldquo;Prefer not to say&rdquo; for anything you would rather not share.
        </p>
      </div>
      <div className="grid gap-5 rounded-xl border border-line bg-white p-5 sm:grid-cols-2 sm:p-6">
        {field("department_option_id", "Department", o.departments.map((d) => ({ value: d.id, label: d.label })))}
        {field("location_option_id", "Office location", o.locations.map((d) => ({ value: d.id, label: d.label })))}
        {field("level_option_id", "Organizational level", o.levels.map((d) => ({ value: d.id, label: d.label })))}
        {field("tenure_range", "Time with the organization", o.tenure.map((t) => ({ value: t.key, label: t.label })))}
      </div>
    </div>
  );
}

function RatingRow({
  questionId,
  perspective,
  label,
  value,
  allowNa,
  invalid,
  onChange,
}: {
  questionId: string;
  perspective: "current" | "desired";
  label: string;
  value: Rating;
  allowNa: boolean;
  invalid: boolean;
  onChange: (v: Rating) => void;
}) {
  const name = `${questionId}-${perspective}`;
  return (
    <fieldset className={cn("rounded-lg p-3 transition-colors", invalid ? "bg-red-50 ring-1 ring-red-200" : "bg-canvas")}>
      <legend className="sr-only">{label}</legend>
      <p className={cn("mb-2 text-xs font-semibold uppercase tracking-[0.1em]", perspective === "current" ? "text-navy-700" : "text-emerald-700")} aria-hidden>
        {label}
      </p>
      <div className={cn("grid gap-1.5", allowNa ? "grid-cols-6" : "grid-cols-5")}>
        {SCALE.map((s) => {
          const selected = value === s.value;
          return (
            <label
              key={s.value}
              className={cn(
                "flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-md border px-1 py-1.5 text-center transition-all focus-within:ring-2 focus-within:ring-emerald-500",
                selected
                  ? perspective === "current"
                    ? "border-navy-800 bg-navy-800 text-white shadow-sm"
                    : "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                  : "border-line bg-white text-navy-800 hover:border-navy-300",
              )}
            >
              <input type="radio" name={name} value={s.value} checked={selected} onChange={() => onChange(s.value)} className="sr-only" />
              <span className="text-sm font-semibold tabular-nums">{s.value}</span>
              <span className="mt-0.5 hidden text-[10px] leading-tight sm:block">{s.label}</span>
              <span className="mt-0.5 text-[10px] leading-tight sm:hidden" aria-hidden>
                {s.short}
              </span>
              <span className="sr-only sm:hidden">{s.label}</span>
            </label>
          );
        })}
        {allowNa ? (
          <label
            className={cn(
              "flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-1 py-1.5 text-center text-xs transition-all focus-within:ring-2 focus-within:ring-emerald-500",
              value === "NA" ? "border-navy-500 bg-navy-100 font-semibold text-navy-900" : "border-navy-200 bg-white text-muted hover:border-navy-400",
            )}
          >
            <input type="radio" name={name} value="NA" checked={value === "NA"} onChange={() => onChange("NA")} className="sr-only" />
            N/A
            <span className="mt-0.5 hidden text-[10px] leading-tight sm:block">Not applicable</span>
          </label>
        ) : null}
      </div>
    </fieldset>
  );
}

function SectionStep({
  survey,
  index,
  answers,
  missing,
  onAnswer,
}: {
  survey: SurveyDefinition;
  index: number;
  answers: Record<string, Answer>;
  missing: Set<string>;
  onAnswer: (questionId: string, perspective: "current" | "desired", value: Rating) => void;
}) {
  const section = survey.sections[index];
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
          {section.code} · Section {index + 1}
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-navy-900 sm:text-3xl">{section.name}</h2>
        <p className="mt-2 leading-relaxed text-muted">{section.description}</p>
      </div>
      <div className="grid gap-2 rounded-lg border border-line bg-white p-3 text-xs text-navy-800 sm:grid-cols-2">
        <p>
          <span className="font-semibold text-navy-800">Current</span> — {survey.currentLabel.replace(/^Current state\s*[—-]\s*/i, "")}
        </p>
        <p>
          <span className="font-semibold text-emerald-700">Desired</span> — {survey.desiredLabel.replace(/^Desired state\s*[—-]\s*/i, "")}
        </p>
        <p className="text-muted sm:col-span-2">1 = Strongly disagree · 2 = Disagree · 3 = Neither agree nor disagree · 4 = Agree · 5 = Strongly agree</p>
      </div>
      <ol className="space-y-5">
        {section.questions.map((q, qi) => (
          <li key={q.id} id={`q-${q.id}`} className="scroll-mt-24 rounded-xl border border-line bg-white p-4 shadow-card sm:p-5">
            <p className="font-medium leading-relaxed text-navy-900">
              <span className="mr-2 text-sm text-muted tabular-nums">{qi + 1}.</span>
              {q.prompt}
            </p>
            <div className="mt-4 space-y-3">
              <RatingRow
                questionId={q.id}
                perspective="current"
                label="Current state — today"
                value={answers[q.id]?.current ?? null}
                allowNa={q.allowNa}
                invalid={missing.has(`${q.id}:current`)}
                onChange={(v) => onAnswer(q.id, "current", v)}
              />
              <RatingRow
                questionId={q.id}
                perspective="desired"
                label="Desired state — how it should be"
                value={answers[q.id]?.desired ?? null}
                allowNa={q.allowNa}
                invalid={missing.has(`${q.id}:desired`)}
                onChange={(v) => onAnswer(q.id, "desired", v)}
              />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FeedbackStep({
  survey,
  comments,
  consentToQuote,
  onComment,
  onConsent,
}: {
  survey: SurveyDefinition;
  comments: Record<string, string>;
  consentToQuote: boolean;
  onComment: (key: string, value: string) => void;
  onConsent: (v: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-navy-900 sm:text-3xl">Additional feedback</h2>
        <p className="mt-2 leading-relaxed text-muted">
          These questions are optional and are not part of any score. Please do not include names or details that could identify
          you or anyone else.
        </p>
      </div>
      {survey.qualitative.map((q) => (
        <div key={q.id} className="rounded-xl border border-line bg-white p-4 sm:p-5">
          <Label htmlFor={`c-${q.key}`} className="leading-relaxed">
            {q.prompt}
          </Label>
          <Textarea
            id={`c-${q.key}`}
            className="mt-3"
            rows={4}
            maxLength={2000}
            value={comments[q.key] ?? ""}
            onChange={(e) => onComment(q.key, e.target.value)}
          />
          <p className="mt-1 text-right text-[11px] text-muted tabular-nums">{(comments[q.key] ?? "").length} / 2000</p>
        </div>
      ))}
      <label className="flex items-start gap-3 rounded-xl border border-line bg-white p-4 text-sm text-navy-900">
        <Checkbox checked={consentToQuote} onChange={(e) => onConsent(e.target.checked)} className="mt-0.5 h-5 w-5" />
        <span>
          <strong>Optional:</strong> I give permission for my comments to be shown word-for-word (with identifiers removed) to my
          organization&apos;s leadership. Without this permission, comments are used only to identify common themes.
        </span>
      </label>
    </div>
  );
}

function ReviewStep({
  survey,
  state,
  steps,
  onEdit,
}: {
  survey: SurveyDefinition;
  state: SavedState;
  steps: Step[];
  onEdit: (stepIndex: number) => void;
}) {
  const fmt = (r: Rating | undefined) => (r === "NA" ? "N/A" : r ? String(r) : "—");
  const commentCount = survey.qualitative.filter((q) => (state.comments[q.key] ?? "").trim()).length;
  const labelFor = (list: { id: string; label: string }[], id: string | null) => list.find((x) => x.id === id)?.label ?? "Prefer not to say";
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-navy-900 sm:text-3xl">Review and submit</h2>
        <p className="mt-2 leading-relaxed text-muted">Check your answers below. You can go back to any section to change them. Once submitted, responses cannot be changed.</p>
      </div>
      {survey.privacyMode === "confidential" && steps.some((s) => s.kind === "profile") ? (
        <div className="rounded-xl border border-line bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-sm font-semibold text-navy-900">About you</h3>
            <button className="text-sm font-medium text-emerald-700 underline" onClick={() => onEdit(steps.findIndex((s) => s.kind === "profile"))}>
              Edit
            </button>
          </div>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {survey.profileOptions.departments.length ? (
              <div>
                <dt className="text-muted">Department</dt>
                <dd>{labelFor(survey.profileOptions.departments, state.profile.department_option_id)}</dd>
              </div>
            ) : null}
            {survey.profileOptions.locations.length ? (
              <div>
                <dt className="text-muted">Office location</dt>
                <dd>{labelFor(survey.profileOptions.locations, state.profile.location_option_id)}</dd>
              </div>
            ) : null}
            {survey.profileOptions.levels.length ? (
              <div>
                <dt className="text-muted">Organizational level</dt>
                <dd>{labelFor(survey.profileOptions.levels, state.profile.level_option_id)}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-muted">Tenure</dt>
              <dd>{survey.profileOptions.tenure.find((t) => t.key === state.profile.tenure_range)?.label ?? "Prefer not to say"}</dd>
            </div>
          </dl>
        </div>
      ) : null}
      {survey.sections.map((section, i) => {
        const stepIndex = steps.findIndex((s) => s.kind === "section" && s.index === i);
        return (
          <div key={section.key} className="rounded-xl border border-line bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-sans text-sm font-semibold text-navy-900">{section.name}</h3>
              <button className="text-sm font-medium text-emerald-700 underline" onClick={() => onEdit(stepIndex)}>
                Edit
              </button>
            </div>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="py-1 font-medium">Statement</th>
                  <th className="w-16 py-1 text-center font-medium">Current</th>
                  <th className="w-16 py-1 text-center font-medium">Desired</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {section.questions.map((q) => (
                  <tr key={q.id}>
                    <td className="py-2 pr-3 text-navy-800">{q.prompt}</td>
                    <td className="py-2 text-center font-semibold tabular-nums text-navy-800">{fmt(state.answers[q.id]?.current)}</td>
                    <td className="py-2 text-center font-semibold tabular-nums text-emerald-700">{fmt(state.answers[q.id]?.desired)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      <div className="rounded-xl border border-line bg-white p-4 text-sm sm:p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-sm font-semibold text-navy-900">Additional feedback</h3>
          <button className="text-sm font-medium text-emerald-700 underline" onClick={() => onEdit(steps.findIndex((s) => s.kind === "feedback"))}>
            Edit
          </button>
        </div>
        <p className="mt-2 text-muted">
          {commentCount === 0 ? "No comments provided." : `${commentCount} of ${survey.qualitative.length} questions answered.`}{" "}
          {commentCount > 0 ? (state.consentToQuote ? "You permitted verbatim quotation (identifiers removed)." : "Comments will be used for theme analysis only.") : null}
        </p>
      </div>
    </div>
  );
}

/** "A, B and C" in lower case, for use inside a sentence. */
function listNames(names: string[]): string {
  const lower = names.map((n) => n.replace(/(^|\s)([A-Z])(?=[a-z])/g, (_m, sp: string, c: string) => sp + c.toLowerCase()));
  return lower.length <= 1 ? (lower[0] ?? "") : `${lower.slice(0, -1).join(", ")} and ${lower[lower.length - 1]}`;
}
