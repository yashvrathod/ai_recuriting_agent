"use client";
import { useUser } from "@/app/client-providers";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/services/supabaseClient";

function QuestionList({ formData, onCreateLink }) {
  const [loading, setLoading] = useState(true);
  const [questionList, setQuestionList] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newQuestionType, setNewQuestionType] = useState("behavioral");
  const { user, updateUserCredits } = useUser();
  const hasCalled = useRef(false);

  useEffect(() => {
    if (formData && !hasCalled.current) {
      hasCalled.current = true;
      GenerateQuestionList();
    }
  }, [formData]);

  const GenerateQuestionList = async () => {
    setLoading(true);
    try {
      const result = await axios.post("/api/ai-model", { ...formData });
      const rawContent = result?.data?.content || result?.data?.Content;

      if (!rawContent) {
        toast("Invalid response format");
        console.error("❌ Missing content in response:", result?.data);
        return;
      }

      let parsedData;
      try {
        parsedData = JSON.parse(rawContent.trim());
      } catch (err) {
        toast("Invalid AI response format");
        console.error("❌ Failed to parse JSON:", err, rawContent);
        return;
      }

      setQuestionList(parsedData);
    } catch (e) {
      toast("Server Error, Try Again");
      console.error("❌ Error generating questions:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) {
      toast("Please enter a question");
      return;
    }

    setQuestionList((prev) => {
      if (!prev || !prev.interviewQuestions) return prev;
      const newQuestionObj = { question: newQuestion, type: newQuestionType };
      return {
        ...prev,
        interviewQuestions: [...prev.interviewQuestions, newQuestionObj],
      };
    });

    setNewQuestion("");
    setNewQuestionType("behavioral");
    toast("Question added successfully");
  };

  const handleDeleteQuestion = (index) => {
    setQuestionList((prev) => {
      if (!prev || !prev.interviewQuestions) return prev;
      const updatedQuestions = [...prev.interviewQuestions];
      updatedQuestions.splice(index, 1);
      return { ...prev, interviewQuestions: updatedQuestions };
    });
    toast("Question deleted successfully");
  };

  const onFinish = async () => {
    setSaveLoading(true);
    const interview_id = uuidv4();

    try {
      const currentCredits = user?.credits || 0;
      if (currentCredits <= 0) {
        toast.error("You don't have enough credits to create an interview");
        setSaveLoading(false);
        return;
      }

      const newCredits = currentCredits - 1;
      const creditUpdateResult = await updateUserCredits(newCredits);

      if (!creditUpdateResult.success) {
        toast.error("Failed to deduct credit. Please try again.");
        setSaveLoading(false);
        return;
      }

      // ✅ Make sure questionList is safe JSON
      const sanitizedQuestionList = JSON.parse(JSON.stringify(questionList));

      // ✅ Insert into Supabase with detailed error handling
      const { data, error } = await supabase
        .from("interviews")
        .insert([
          {
            interview_id,
            useremail: user?.email, // ✅ match column name exactly
            jobposition: formData.jobposition,
            jobdescription: formData.jobdescription,
            duration: formData.duration,
            type: formData.type,
            questionlist: sanitizedQuestionList, // ✅ lowercase name
          },
        ])
        .select()
        .throwOnError();

      console.log("✅ Supabase insert result:", { data, error });

      if (error) {
        console.error("❌ Supabase error:", JSON.stringify(error, null, 2));
        toast("Failed to save interview");
        await updateUserCredits(currentCredits); // revert credit
      } else {
        toast.success(
          `Interview saved successfully! You now have ${newCredits} credits.`
        );
        onCreateLink(interview_id);
      }
    } catch (e) {
      console.error("❌ Error saving interview:", e);
      toast("Error saving interview");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div>
      {loading && (
        <div className="flex flex-col items-center gap-4 mt-10">
          <Loader2Icon className="animate-spin w-6 h-6 text-blue-500" />
          <div className="p-5 bg-blue-50 rounded-xl border border-gray-100 flex flex-col gap-2 items-center text-center">
            <h2 className="font-semibold text-lg">
              Generating Interview Questions
            </h2>
            <p className="text-sm text-gray-600">
              Our AI is crafting personalized questions based on your job
              position...
            </p>
          </div>
        </div>
      )}

      {!loading && questionList && questionList.interviewQuestions && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Generated Questions
          </h2>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-800">
                  Credits Remaining:
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {user?.credits || 0}
                </span>
              </div>
              <div className="text-sm text-blue-600">Cost: 1 Credit</div>
            </div>
          </div>

          <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium mb-3">Add Custom Question</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Enter your question"
                className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <select
                value={newQuestionType}
                onChange={(e) => setNewQuestionType(e.target.value)}
                className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="behavioral">Behavioral</option>
                <option value="technical">Technical</option>
                <option value="situational">Situational</option>
                <option value="cultural">Cultural Fit</option>
              </select>
              <Button
                onClick={handleAddQuestion}
                className="flex items-center gap-1"
              >
                <PlusIcon className="w-4 h-4" /> Add Question
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {questionList.interviewQuestions.map((item, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg bg-white shadow-sm flex justify-between items-start"
              >
                <div>
                  <p className="font-medium">
                    {index + 1}. {item.question}
                  </p>
                  <p className="text-sm text-primary">Type: {item.type}</p>
                </div>
                <button
                  onClick={() => handleDeleteQuestion(index)}
                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                >
                  <Trash2Icon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-10">
            <Button
              onClick={onFinish}
              disabled={saveLoading || (user?.credits || 0) <= 0}
              className={
                user?.credits <= 0 ? "bg-gray-400 cursor-not-allowed" : ""
              }
            >
              {saveLoading ? (
                <>
                  <Loader2Icon className="animate-spin w-4 h-4 mr-2" />
                  Saving...
                </>
              ) : user?.credits <= 0 ? (
                "No Credits Available"
              ) : (
                "Create Interview Link & Finish"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionList;
