import React, { useState, useMemo } from 'react';
import { Message, UserFeedback } from '../../types';

const FEEDBACK_DIMENSIONS = [
  { id: 'correctness', label: 'Correctness / Accuracy', weight: 20 },
  { id: 'relevance', label: 'Relevance / On-topic', weight: 15 },
  { id: 'completeness', label: 'Completeness', weight: 15 },
  { id: 'clarity', label: 'Clarity / Understandability', weight: 10 },
  { id: 'tone', label: 'Tone / Empathy / Voice Fit', weight: 10 },
  { id: 'efficiency', label: 'Efficiency / Brevity', weight: 5 },
  { id: 'compliance', label: 'Compliance / Scope Adherence', weight: 10 },
  { id: 'context', label: 'Context / Memory Handling', weight: 5 },
  { id: 'actionability', label: 'Actionability / Next Steps Provided', weight: 5 },
  { id: 'escalation', label: 'Escalation Appropriateness', weight: 5 },
];

const SCORE_OPTIONS = ['0', '1', '2', '3', 'N/A'];

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: Omit<UserFeedback, 'id'|'submittedAt'|'chatId'>) => void;
  userMessage: Message;
  aiMessage: Message;
  initialRating: 'good' | 'bad';
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit, userMessage, aiMessage, initialRating }) => {
  const [scores, setScores] = useState<Record<string, number | 'N/A' | null>>(
    FEEDBACK_DIMENSIONS.reduce((acc, dim) => ({ ...acc, [dim.id]: null }), {})
  );
  const [comment, setComment] = useState('');

  const handleScoreChange = (dimensionId: string, scoreValue: string) => {
    const newScore = scoreValue === 'N/A' ? 'N/A' : parseInt(scoreValue, 10);
    setScores(prev => ({ ...prev, [dimensionId]: newScore }));
  };

  const { totalWeightedScore, maxPossibleScore, isComplete } = useMemo(() => {
    let totalScore = 0;
    let maxScore = 100;
    const allScored = FEEDBACK_DIMENSIONS.every(d => scores[d.id] !== null);

    FEEDBACK_DIMENSIONS.forEach(dim => {
      const score = scores[dim.id];
      if (score === 'N/A') {
        maxScore -= dim.weight;
      } else if (typeof score === 'number') {
        // Weighted score for this item is (score / max_item_score) * weight
        totalScore += (score / 3) * dim.weight;
      }
    });
    
    return {
      totalWeightedScore: totalScore,
      maxPossibleScore: maxScore > 0 ? maxScore : 1, // Avoid division by zero
      isComplete: allScored,
    };
  }, [scores]);

  const handleSubmit = () => {
    if (!isComplete) return;
    const feedbackData: Omit<UserFeedback, 'id'|'submittedAt'|'chatId'> = {
      messageId: aiMessage.id,
      userMessage,
      aiMessage,
      initialRating,
      scores: FEEDBACK_DIMENSIONS.map(dim => ({
        dimension: dim.label,
        weight: dim.weight,
        score: scores[dim.id]!,
      })),
      totalWeightedScore,
      maxPossibleScore,
      comment: comment.trim(),
    };
    onSubmit(feedbackData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-neutral-800">Provide Detailed Feedback</h2>
          <p className="text-sm text-neutral-500">Your feedback helps improve the AI Assistant for everyone.</p>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-neutral-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-neutral-700 mb-2 text-sm">Your Prompt:</h3>
                <p className="text-sm text-neutral-600">{userMessage.text}</p>
            </div>
            <div className="bg-sky-50 p-4 rounded-lg border border-sky-200">
                <h3 className="font-semibold text-primary mb-2 text-sm">Chatbot Response:</h3>
                <div className="text-sm text-neutral-800" dangerouslySetInnerHTML={{ __html: aiMessage.text.replace(/\n/g, '<br />') }} />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-neutral-600">Dimension</th>
                  <th className="px-2 py-2 text-center font-semibold text-neutral-600 w-16">Weight</th>
                  <th className="px-4 py-2 text-center font-semibold text-neutral-600 w-64">Score (0=Poor, 3=Excellent)</th>
                  <th className="px-2 py-2 text-center font-semibold text-neutral-600 w-24">Weighted Score</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {FEEDBACK_DIMENSIONS.map(dim => {
                  const score = scores[dim.id];
                  const weightedScore = typeof score === 'number' ? (score / 3) * dim.weight : 0;
                  return (
                    <tr key={dim.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-2 font-medium text-neutral-800">{dim.label}</td>
                      <td className="px-2 py-2 text-center text-neutral-500">{dim.weight}%</td>
                      <td className="px-4 py-2">
                        <fieldset className="flex justify-around items-center">
                          <legend className="sr-only">{dim.label}</legend>
                          {SCORE_OPTIONS.map(opt => (
                            <label key={opt} className="text-center text-xs text-neutral-600">
                              {opt}
                              <input
                                type="radio"
                                name={dim.id}
                                value={opt}
                                checked={String(scores[dim.id]) === opt}
                                onChange={e => handleScoreChange(dim.id, e.target.value)}
                                className="block mx-auto mt-1 accent-primary"
                              />
                            </label>
                          ))}
                        </fieldset>
                      </td>
                      <td className="px-2 py-2 text-center font-semibold text-neutral-800">{weightedScore.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-right bg-neutral-100 p-3 rounded-lg">
                <span className="font-bold text-lg text-neutral-800">
                  Total Score: {totalWeightedScore.toFixed(2)} / {maxPossibleScore.toFixed(0)}
                </span>
                {isComplete && maxPossibleScore > 0 && (
                    <span className="ml-4 font-bold text-lg text-primary">
                        Final: {((totalWeightedScore / maxPossibleScore) * 100).toFixed(2)}%
                    </span>
                )}
          </div>

           <div className="mt-6">
                <label htmlFor="comments" className="block text-sm font-medium text-neutral-700 mb-2">Notes / Comments (Optional)</label>
                <textarea
                    id="comments"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                    className="w-full p-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                    placeholder="Provide any additional context or suggestions here..."
                />
            </div>
        </div>

        <div className="p-4 bg-neutral-50 border-t flex justify-end space-x-3">
            <button onClick={onClose} className="px-6 py-2 bg-neutral-200 text-neutral-800 rounded-lg font-semibold hover:bg-neutral-300 transition-colors">
                Cancel
            </button>
            <button
                onClick={handleSubmit}
                disabled={!isComplete}
                className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed"
            >
                Submit Feedback
            </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
