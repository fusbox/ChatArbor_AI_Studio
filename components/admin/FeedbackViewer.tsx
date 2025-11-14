

import React, { useState, useEffect } from 'react';
import { UserFeedback } from '../../types';
import * as apiService from '../../services/apiService';
import Spinner from '../shared/Spinner';

const FeedbackDetailsModal: React.FC<{ feedback: UserFeedback, onClose: () => void }> = ({ feedback, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-semibold">Feedback Details</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-neutral-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-neutral-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-sm mb-1">User Prompt</h4>
                        <p className="text-sm text-neutral-700">{feedback.userMessage.text}</p>
                    </div>
                     <div className="bg-neutral-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-sm mb-1">AI Response</h4>
                        <p className="text-sm text-neutral-700">{feedback.aiMessage.text}</p>
                    </div>
                </div>

                <div className="mb-4">
                    <h4 className="font-semibold text-sm mb-2">Scores</h4>
                     <table className="w-full text-sm text-left">
                        <thead className="text-xs text-neutral-700 uppercase bg-neutral-100">
                            <tr>
                                <th className="px-4 py-2">Dimension</th>
                                <th className="px-4 py-2 text-center">Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feedback.scores.map(s => (
                                <tr key={s.dimension} className="border-b">
                                    <td className="px-4 py-2">{s.dimension} ({s.weight}%)</td>
                                    <td className="px-4 py-2 text-center font-medium">{s.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="text-right font-bold text-lg mb-4">
                    Final Score: {feedback.totalWeightedScore.toFixed(2)} / {feedback.maxPossibleScore} ({((feedback.totalWeightedScore / feedback.maxPossibleScore) * 100).toFixed(2)}%)
                </div>
                 
                {feedback.comment && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <h4 className="font-semibold text-sm mb-1">Comments</h4>
                        <p className="text-sm text-neutral-700 whitespace-pre-wrap">{feedback.comment}</p>
                    </div>
                )}
            </div>
        </div>
    )
}


const FeedbackViewer: React.FC = () => {
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<UserFeedback | null>(null);


  useEffect(() => {
    const fetchFeedback = async () => {
      setIsLoading(true);
      const data = await apiService.getFeedback();
      setFeedback(data.sort((a,b) => b.submittedAt - a.submittedAt));
      setIsLoading(false);
    };
    fetchFeedback();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-neutral-800">User Feedback</h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        {isLoading ? <Spinner /> :
          feedback.length === 0 ? <p className="text-neutral-500">No feedback submitted yet.</p> :
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-neutral-500">
                <thead className="text-xs text-neutral-700 uppercase bg-neutral-50">
                <tr>
                    <th scope="col" className="px-6 py-3">Date</th>
                    <th scope="col" className="px-6 py-3">Initial Rating</th>
                    <th scope="col" className="px-6 py-3">Final Score</th>
                    <th scope="col" className="px-6 py-3">Comment</th>
                    <th scope="col" className="px-6 py-3 text-right">Actions</th>
                </tr>
                </thead>
                <tbody>
                {feedback.map((item) => (
                    <tr key={item.id} className="bg-white border-b hover:bg-neutral-50">
                    <td className="px-6 py-4 text-xs">{new Date(item.submittedAt).toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium">
                        {item.initialRating === 'good' ? (
                        <span className="flex items-center text-emerald-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h6.758a1 1 0 00.97-1.226l-1.42-4.262a1 1 0 00-.97-.774H9V6.5a1.5 1.5 0 00-3 0v3.833z" /></svg>
                            Good
                        </span>
                        ) : (
                        <span className="flex items-center text-red-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667V3a1 1 0 00-1-1H6.242a1 1 0 00-.97 1.226l1.42 4.262a1 1 0 00.97.774H11v7.5a1.5 1.5 0 003 0V9.667z" /></svg>
                            Bad
                        </span>
                        )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-neutral-800">
                        {((item.totalWeightedScore / item.maxPossibleScore) * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4">
                        <p className="max-w-xs truncate text-xs italic text-neutral-500">
                            {item.comment || "No comment"}
                        </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button 
                            onClick={() => setSelectedFeedback(item)}
                            className="font-medium text-primary hover:underline">
                            View Details
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
          </div>
        }
      </div>
      {selectedFeedback && <FeedbackDetailsModal feedback={selectedFeedback} onClose={() => setSelectedFeedback(null)} />}
    </div>
  );
};

export default FeedbackViewer;
