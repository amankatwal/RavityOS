"use client"

import { useState, type FormEvent } from 'react'
import type { AgentConfigType } from '@/app/data/AgentConfigResSchema'
import { AnimatedButton } from '@/components/ui/AnimatedButton'

type AgentQuestionnaireProps = {
  response: AgentConfigType
  onSubmit: (answers: Record<string, string | string[]>) => void
}

const customOption = '__custom__'

export default function AgentQuestionnaire({ response, onSubmit }: AgentQuestionnaireProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({})

  const updateAnswer = (id: string, value: string | string[]) => {
    setAnswers((current) => ({ ...current, [id]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const completedAnswers = Object.fromEntries(
      response.clarificationQuestions.map((question) => {
        const answer = answers[question.id]
        if (question.type === 'single_select' && answer === customOption) {
          return [question.id, customAnswers[question.id] ?? '']
        }
        if (question.type === 'multi_select') {
          const selected = Array.isArray(answer) ? answer : []
          const custom = customAnswers[question.id]?.trim()
          return [question.id, custom ? [...selected, custom] : selected]
        }
        return [question.id, answer ?? '']
      })
    ) as Record<string, string | string[]>

    onSubmit(completedAnswers)
  }

  if (!response.clarificationQuestions.length) {
    return <p className="text-sm text-muted-foreground">No follow-up questions were returned.</p>
  }

  const requiredAnswersPresent = response.clarificationQuestions.every((question) => {
    const answer = answers[question.id]
    if (question.type === 'multi_select') {
      return (Array.isArray(answer) && answer.length > 0) || Boolean(customAnswers[question.id]?.trim())
    }
    if (question.type === 'single_select' && answer === customOption) {
      return Boolean(customAnswers[question.id]?.trim())
    }
    return typeof answer === 'string' && answer.trim().length > 0
  })

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6 rounded-lg border bg-background p-5">
      <div>
        <h2 className="text-lg font-semibold">A few details</h2>
        <p className="mt-1 text-sm text-muted-foreground">Answer these questions to finish configuring your agent.</p>
      </div>
      {response.clarificationQuestions.map((question, index) => (
        <fieldset key={question.id} className="space-y-3">
          <legend className="mb-3 font-medium">{index + 1}. {question.question}</legend>

          {question.type === 'single_select' && (
            <div className="space-y-2">
              {question.options.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={() => updateAnswer(question.id, option)}
                  />
                  {option}
                </label>
              ))}
              {question.allowCustom && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={question.id}
                      value={customOption}
                      checked={answers[question.id] === customOption}
                      onChange={() => updateAnswer(question.id, customOption)}
                    />
                    Other
                  </label>
                  {answers[question.id] === customOption && (
                    <input
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      placeholder={question.customPlaceholder || 'Enter your answer'}
                      value={customAnswers[question.id] ?? ''}
                      onChange={(event) => setCustomAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {question.type === 'multi_select' && (
            <div className="space-y-2">
              {question.options.map((option) => {
                const selected = Array.isArray(answers[question.id]) && answers[question.id].includes(option)
                return (
                  <label key={option} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(event) => {
                        const answer = answers[question.id]
                        const current = Array.isArray(answer) ? answer : []
                        updateAnswer(question.id, event.target.checked
                          ? [...current, option]
                          : current.filter((value) => value !== option))
                      }}
                    />
                    {option}
                  </label>
                )
              })}
              {question.allowCustom && (
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder={question.customPlaceholder || 'Add another option'}
                  value={customAnswers[question.id] ?? ''}
                  onChange={(event) => setCustomAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                />
              )}
            </div>
          )}

          {['text', 'number', 'date', 'time'].includes(question.type) && (
            question.type === 'text' ? (
              <textarea
                className="min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
                placeholder={question.customPlaceholder || 'Your answer'}
                value={typeof answers[question.id] === 'string' ? answers[question.id] : ''}
                onChange={(event) => updateAnswer(question.id, event.target.value)}
              />
            ) : (
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                type={question.type}
                placeholder={question.customPlaceholder || undefined}
                value={typeof answers[question.id] === 'string' ? answers[question.id] : ''}
                onChange={(event) => updateAnswer(question.id, event.target.value)}
              />
            )
          )}
        </fieldset>
      ))}
      <AnimatedButton type="submit" disabled={!requiredAnswersPresent}>Continue</AnimatedButton>
    </form>
  )
}