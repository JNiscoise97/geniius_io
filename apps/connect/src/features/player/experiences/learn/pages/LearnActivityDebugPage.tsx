// src/features/player/experiences/learn/pages/LearnActivityDebugPage.tsx

import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { getActivityDefinition } from "../../../core/activity/content/queries/getActivityDefinition";
import { getAllActivityRawFiles } from "../../../core/activity/content/loaders/activityContentLoader";


export function LearnActivityDebugPage() {
  const { activitySlug } = useParams();
  const slug = activitySlug ?? "famille-quiz";

  const activity = useMemo(() => getActivityDefinition(slug), [slug]);
console.log("activity raw files", Object.keys(getAllActivityRawFiles()));
  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-6 pb-10">
        <h1 className="text-2xl font-black text-slate-900">{activity.title}</h1>

        <div className="mt-2 text-sm font-bold text-slate-700">
          Mode : <b>{activity.mode}</b>
        </div>

        {activity.description ? (
          <div className="mt-2 text-sm text-slate-700">{activity.description}</div>
        ) : null}

        {activity.introMarkdown ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-black uppercase tracking-wide text-slate-500">
              Intro markdown
            </div>
            <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
              {activity.introMarkdown}
            </pre>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          {activity.sections.map((section) => (
            <section
              key={section.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="text-lg font-black text-slate-900">
                {section.title}
              </div>
              <div className="mt-1 text-xs font-bold text-slate-600">
                id: {section.id} • kind: {section.kind ?? "standard"}
              </div>

              {section.introMarkdown ? (
                <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                  {section.introMarkdown}
                </pre>
              ) : null}

              <div className="mt-4 grid gap-3">
                {section.questions.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="text-sm font-black text-slate-900">
                      {q.prompt}
                    </div>
                    <div className="mt-1 text-xs font-bold text-slate-600">
                      id: {q.id} • type: {q.type} • evaluation: {q.evaluation.kind}
                    </div>

                    {"options" in q && Array.isArray(q.options) ? (
                      <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                        {q.options.map((opt) => (
                          <li key={opt.value}>
                            {opt.label} <span className="text-slate-500">({opt.value})</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {q.feedback?.explanationMarkdown ? (
                      <div className="mt-2 text-sm text-slate-700">
                        <b>Explication :</b> {q.feedback.explanationMarkdown}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}