import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/ui/card';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { TestSectionProps } from './types';
import { TestForm } from './TestForm';
import { TestResult } from './TestResult';
import { TestExamples } from './TestExamples';

export function TestSection({ testMessage, setTestMessage }: TestSectionProps) {
  const [testResult, setTestResult] = useState<any>(null);

  const testAIMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/ia/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      if (!response.ok) throw new Error('Falha no teste da IA');
      return response.json();
    },
    onSuccess: (data) => {
      setTestResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/ia/logs'] });
    }
  });

  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMessage.trim()) return;
    testAIMutation.mutate(testMessage);
    setTestMessage('');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Teste da Prof. Ana
          </CardTitle>
          <CardDescription>
            Teste o comportamento da IA com diferentes tipos de mensagens e cenários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TestForm
            testMessage={testMessage}
            setTestMessage={setTestMessage}
            isPending={testAIMutation.isPending}
            onSubmit={handleTestSubmit}
          />
          <TestResult testResult={testResult} />
        </CardContent>
      </Card>
      <TestExamples setTestMessage={setTestMessage} />
    </div>
  );
} 