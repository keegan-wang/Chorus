'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface Question {
  id: string;
  text: string;
  order: number;
}

const studyTypes = [
  { value: 'exploratory', label: 'Exploratory Research', description: 'Open-ended discovery and understanding' },
  { value: 'usability', label: 'Usability Testing', description: 'Test product or feature usability' },
  { value: 'satisfaction', label: 'Satisfaction Survey', description: 'Measure customer satisfaction' },
  { value: 'custom', label: 'Custom', description: 'Create your own structure' },
];

const guardrailProfiles = [
  { value: 'strict', label: 'Strict', description: 'Minimal deviation from script' },
  { value: 'balanced', label: 'Balanced', description: 'Moderate flexibility (recommended)' },
  { value: 'open', label: 'Open', description: 'High flexibility for exploration' },
  { value: 'empathetic', label: 'Empathetic', description: 'Focus on emotional responses' },
];

export default function NewStudyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'exploratory',
    targetParticipants: 50,
    guardrailProfile: 'balanced',
    maxFollowUps: 2,
    maxQuestions: 10,
    allowSkip: true,
    requireAudioResponse: false,
  });
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', text: '', order: 1 },
  ]);

  const updateField = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: String(questions.length + 1),
      text: '',
      order: questions.length + 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, text: string) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, text } : q))
    );
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  async function handleSubmit() {
    const validQuestions = questions.filter((q) => q.text.trim());
    if (validQuestions.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No questions',
        description: 'Please add at least one question.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Not authenticated',
          description: 'Please log in to create a study.',
        });
        return;
      }

      // Get the user's organization
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userData?.organization_id) {
        toast({
          variant: 'destructive',
          title: 'No organization',
          description: 'Please set up your organization first.',
        });
        return;
      }

      // Create the study
      const { data: study, error: studyError } = await supabase
        .from('studies')
        .insert({
          organization_id: userData.organization_id,
          title: formData.title,
          description: formData.description,
          type: formData.type,
          target_participants: formData.targetParticipants,
          guardrail_profile_id: formData.guardrailProfile,
          interview_config: {
            max_follow_ups: formData.maxFollowUps,
            max_questions: formData.maxQuestions,
            allow_skip: formData.allowSkip,
            require_audio_response: formData.requireAudioResponse,
          },
          status: 'draft',
        })
        .select()
        .single();

      if (studyError) {
        throw studyError;
      }

      // Create the questions
      const questionInserts = validQuestions.map((q, index) => ({
        study_id: study.id,
        text: q.text,
        type: 'open_ended',
        order_index: index,
        is_seed: true,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionInserts);

      if (questionsError) {
        throw questionsError;
      }

      toast({
        title: 'Study created',
        description: 'Your study has been created successfully.',
      });

      router.push(`/studies/${study.id}`);
    } catch (error) {
      console.error('Error creating study:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create study. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Create New Study</h1>
        <p className="text-muted-foreground">
          Set up your research study in a few simple steps
        </p>
      </div>

      {/* Progress */}
      <div className="flex space-x-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full ${
              s <= step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Tell us about your research study
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Study Title</Label>
              <Input
                id="title"
                placeholder="e.g., Q1 Customer Satisfaction Study"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe the goals and scope of your study..."
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Study Type</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {studyTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`flex cursor-pointer flex-col rounded-lg border p-4 transition-colors ${
                      formData.type === type.value
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={(e) => updateField('type', e.target.value)}
                      className="sr-only"
                    />
                    <span className="font-medium">{type.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {type.description}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetParticipants">Target Participants</Label>
              <Input
                id="targetParticipants"
                type="number"
                min={1}
                max={10000}
                value={formData.targetParticipants}
                onChange={(e) =>
                  updateField('targetParticipants', parseInt(e.target.value) || 50)
                }
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.title.trim()}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Questions */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Research Questions</CardTitle>
            <CardDescription>
              Add the questions you want to ask participants. The AI will use
              these as starting points and adapt based on responses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="flex items-start space-x-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <Input
                    placeholder={`Enter question ${index + 1}...`}
                    value={question.text}
                    onChange={(e) =>
                      updateQuestion(question.id, e.target.value)
                    }
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuestion(question.id)}
                  disabled={questions.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={addQuestion}>
              + Add Question
            </Button>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!questions.some((q) => q.text.trim())}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Interview Settings */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Interview Settings</CardTitle>
            <CardDescription>
              Configure how the AI interviewer should conduct the interviews
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Guardrail Profile</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {guardrailProfiles.map((profile) => (
                  <label
                    key={profile.value}
                    className={`flex cursor-pointer flex-col rounded-lg border p-4 transition-colors ${
                      formData.guardrailProfile === profile.value
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <input
                      type="radio"
                      name="guardrailProfile"
                      value={profile.value}
                      checked={formData.guardrailProfile === profile.value}
                      onChange={(e) =>
                        updateField('guardrailProfile', e.target.value)
                      }
                      className="sr-only"
                    />
                    <span className="font-medium">{profile.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {profile.description}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxFollowUps">Max Follow-up Questions</Label>
                <Input
                  id="maxFollowUps"
                  type="number"
                  min={0}
                  max={5}
                  value={formData.maxFollowUps}
                  onChange={(e) =>
                    updateField('maxFollowUps', parseInt(e.target.value) || 2)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Number of follow-up questions per main question
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxQuestions">Max Total Questions</Label>
                <Input
                  id="maxQuestions"
                  type="number"
                  min={1}
                  max={50}
                  value={formData.maxQuestions}
                  onChange={(e) =>
                    updateField('maxQuestions', parseInt(e.target.value) || 10)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Maximum questions in a single interview
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.allowSkip}
                  onChange={(e) => updateField('allowSkip', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <span className="font-medium">Allow skipping questions</span>
                  <p className="text-sm text-muted-foreground">
                    Participants can skip questions they prefer not to answer
                  </p>
                </div>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.requireAudioResponse}
                  onChange={(e) =>
                    updateField('requireAudioResponse', e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <span className="font-medium">Require audio responses</span>
                  <p className="text-sm text-muted-foreground">
                    Participants must respond via voice (not text)
                  </p>
                </div>
              </label>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Study'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
