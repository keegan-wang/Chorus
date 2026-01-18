'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { APIError, studiesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, MessageSquare, Users } from 'lucide-react';

interface Theme {
  name: string;
  frequency: number;
  description: string;
}

interface Quote {
  quote: string;
  context: string;
}

interface StatisticItem {
  percentage: string;
  description: string;
}

interface AggregateSummary {
  id: string;
  statistics: StatisticItem[];
  pros: string[];
  cons: string[];
  total_responses_analyzed: number;
  generated_at: string;
}

interface ResearchQuestion {
  id: string;
  root_question: string;
  specific_product?: string;
  research_question_aggregate_summaries?: AggregateSummary[];
}

interface StudyAnalysis {
  executive_summary: string;
  key_findings: string[];
  themes: Theme[];
  positive_highlights: string[];
  negative_pain_points: string[];
  recommendations: string[];
  participant_quotes: Quote[];
  sentiment_distribution?: {
    positive: number;
    neutral: number;
    negative: number;
    mixed: number;
  };
  total_interviews?: number;
  research_questions?: ResearchQuestion[];
}

export default function StudyAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const studyId = params.id as string;

  const [analysis, setAnalysis] = useState<StudyAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, [studyId]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studiesApi.getAnalysis(studyId);

      if (data) {
        // Parse the analysis data if it's stored as JSON
        const analysisData = typeof data.analysis_data === 'string'
          ? JSON.parse(data.analysis_data)
          : data.analysis_data;
        setAnalysis(analysisData);
      }
    } catch (err) {
      console.error('Error loading analysis:', err);
      if (err instanceof APIError && err.status === 404) {
        setError('Study not found for your account.');
      } else if (err instanceof APIError && err.status === 503) {
        setError('Analysis service is unavailable. Try again later.');
      } else {
        setError('No analysis available yet');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async () => {
    try {
      setGenerating(true);
      setError(null);
      const result = await studiesApi.analyze(studyId);
      setAnalysis(result);
    } catch (err) {
      console.error('Error generating analysis:', err);
      if (err instanceof APIError && err.status === 404) {
        setError('Study not found for your account.');
      } else if (err instanceof APIError && err.status === 503) {
        setError('Analysis service is unavailable. Try again later.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate analysis');
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Study Analysis</h1>
            <p className="text-muted-foreground">AI-powered insights from your research</p>
          </div>
        </div>
        <Button onClick={generateAnalysis} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            'Regenerate Analysis'
          )}
        </Button>
      </div>

      {error && !analysis && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={generateAnalysis} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Analysis...
                  </>
                ) : (
                  'Generate Analysis'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <>
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">{analysis.executive_summary}</p>
            </CardContent>
          </Card>

          {/* Sentiment Distribution */}
          {analysis.sentiment_distribution && (
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Overview</CardTitle>
                <CardDescription>
                  Based on {analysis.total_interviews || 0} interviews
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {analysis.sentiment_distribution.positive}
                    </div>
                    <div className="text-sm text-muted-foreground">Positive</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {analysis.sentiment_distribution.neutral}
                    </div>
                    <div className="text-sm text-muted-foreground">Neutral</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">
                      {analysis.sentiment_distribution.negative}
                    </div>
                    <div className="text-sm text-muted-foreground">Negative</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">
                      {analysis.sentiment_distribution.mixed}
                    </div>
                    <div className="text-sm text-muted-foreground">Mixed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Findings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Key Findings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.key_findings.map((finding, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{finding}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Themes */}
          {analysis.themes && analysis.themes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Themes</CardTitle>
                <CardDescription>Common topics across interviews</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.themes.map((theme, idx) => (
                    <div key={idx} className="border-l-4 border-primary pl-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold">{theme.name}</h4>
                        <span className="text-sm text-muted-foreground">
                          {theme.frequency} mentions
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{theme.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Positive & Negative */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Positive Highlights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  Positive Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.positive_highlights.map((item, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-green-600">+</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Negative Pain Points */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  Pain Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.negative_pain_points.map((item, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-red-600">-</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Actionable next steps based on findings</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Participant Quotes */}
          {analysis.participant_quotes && analysis.participant_quotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Representative Quotes</CardTitle>
                <CardDescription>Direct feedback from participants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.participant_quotes.map((item, idx) => (
                    <div key={idx} className="border-l-4 border-muted pl-4 py-2">
                      <p className="italic text-lg mb-2">"{item.quote}"</p>
                      <p className="text-sm text-muted-foreground">{item.context}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Research Questions & Aggregate Data */}
          {analysis.research_questions && analysis.research_questions.length > 0 && (
            <div className="space-y-6">
              <div className="border-t pt-6">
                <h2 className="text-2xl font-bold mb-2">Research Questions Analysis</h2>
                <p className="text-muted-foreground mb-6">
                  Quantitative insights and patterns across all responses
                </p>
              </div>

              {analysis.research_questions.map((rq) => {
                const latestSummary = rq.research_question_aggregate_summaries?.[0];

                if (!latestSummary) return null;

                return (
                  <Card key={rq.id} className="border-2">
                    <CardHeader>
                      <CardTitle className="text-xl">{rq.root_question}</CardTitle>
                      {rq.specific_product && (
                        <CardDescription>Product: {rq.specific_product}</CardDescription>
                      )}
                      <CardDescription>
                        Based on {latestSummary.total_responses_analyzed} responses
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Statistics - Visual Bars */}
                      {latestSummary.statistics && latestSummary.statistics.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-4 flex items-center gap-2">
                            📊 Key Statistics
                          </h4>
                          <div className="space-y-4">
                            {latestSummary.statistics.map((stat, idx) => {
                              // Extract percentage number
                              const percentMatch = stat.percentage.match(/(\d+)/);
                              const percentValue = percentMatch ? parseInt(percentMatch[1]) : 0;

                              return (
                                <div key={idx} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{stat.description}</span>
                                    <span className="text-lg font-bold text-primary">{stat.percentage}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                                      style={{ width: `${percentValue}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Pros & Cons Side by Side */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Pros */}
                        {latestSummary.pros && latestSummary.pros.length > 0 && (
                          <div className="bg-green-50 rounded-lg p-4">
                            <h4 className="font-semibold mb-3 text-green-800 flex items-center gap-2">
                              ✅ Pros
                            </h4>
                            <ul className="space-y-2">
                              {latestSummary.pros.map((pro, idx) => (
                                <li key={idx} className="flex gap-2 text-sm">
                                  <span className="text-green-600 flex-shrink-0">+</span>
                                  <span>{pro}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Cons */}
                        {latestSummary.cons && latestSummary.cons.length > 0 && (
                          <div className="bg-red-50 rounded-lg p-4">
                            <h4 className="font-semibold mb-3 text-red-800 flex items-center gap-2">
                              ❌ Cons
                            </h4>
                            <ul className="space-y-2">
                              {latestSummary.cons.map((con, idx) => (
                                <li key={idx} className="flex gap-2 text-sm">
                                  <span className="text-red-600 flex-shrink-0">-</span>
                                  <span>{con}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
