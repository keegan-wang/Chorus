'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface ParsedParticipant {
  email: string;
  name?: string;
  phone?: string;
  age?: number;
  gender?: string;
  location?: string;
  metadata?: Record<string, unknown>;
}

export default function ImportParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [importMethod, setImportMethod] = useState<'csv' | 'json' | 'shopify' | 'manual'>('csv');
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<ParsedParticipant[]>([]);
  const [shopifyConfig, setShopifyConfig] = useState({
    storeUrl: '',
    accessToken: '',
    customerFilter: 'all',
  });
  const [manualEntry, setManualEntry] = useState({
    email: '',
    name: '',
    phone: '',
  });

  const studyId = params.id as string;

  const parseCSV = useCallback((text: string): ParsedParticipant[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const emailIndex = headers.findIndex((h) =>
      ['email', 'e-mail', 'email_address'].includes(h)
    );

    if (emailIndex === -1) {
      toast({
        variant: 'destructive',
        title: 'Invalid CSV',
        description: 'CSV must contain an email column.',
      });
      return [];
    }

    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const participant: ParsedParticipant = {
        email: values[emailIndex],
      };

      headers.forEach((header, index) => {
        if (index === emailIndex) return;
        const value = values[index];
        if (!value) return;

        if (['name', 'full_name', 'fullname'].includes(header)) {
          participant.name = value;
        } else if (['phone', 'phone_number', 'mobile'].includes(header)) {
          participant.phone = value;
        } else if (['age'].includes(header)) {
          participant.age = parseInt(value) || undefined;
        } else if (['gender', 'sex'].includes(header)) {
          participant.gender = value;
        } else if (['location', 'city', 'country'].includes(header)) {
          participant.location = value;
        } else {
          participant.metadata = participant.metadata || {};
          participant.metadata[header] = value;
        }
      });

      return participant;
    }).filter((p) => p.email && p.email.includes('@'));
  }, [toast]);

  const parseJSON = useCallback((text: string): ParsedParticipant[] => {
    try {
      const data = JSON.parse(text);
      const participants = Array.isArray(data) ? data : data.participants || data.customers || [];
      return participants
        .map((p: Record<string, unknown>) => ({
          email: (p.email || p.e_mail || p.email_address) as string,
          name: (p.name || p.full_name || p.fullName) as string,
          phone: (p.phone || p.phone_number || p.mobile) as string,
          age: p.age ? parseInt(String(p.age)) : undefined,
          gender: p.gender as string,
          location: (p.location || p.city || p.country) as string,
          metadata: p.metadata as Record<string, unknown>,
        }))
        .filter((p: ParsedParticipant) => p.email && p.email.includes('@'));
    } catch {
      toast({
        variant: 'destructive',
        title: 'Invalid JSON',
        description: 'Failed to parse JSON file.',
      });
      return [];
    }
  }, [toast]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const parsed =
          importMethod === 'csv' ? parseCSV(text) : parseJSON(text);
        setPreview(parsed);
      };
      reader.readAsText(file);
    },
    [importMethod, parseCSV, parseJSON]
  );

  const handleShopifyImport = async () => {
    if (!shopifyConfig.storeUrl || !shopifyConfig.accessToken) {
      toast({
        variant: 'destructive',
        title: 'Missing configuration',
        description: 'Please provide store URL and access token.',
      });
      return;
    }

    setIsLoading(true);
    try {
      // In production, this would call our backend API to fetch from Shopify
      toast({
        title: 'Shopify Integration',
        description: 'Shopify import will be handled by the backend API.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualAdd = () => {
    if (!manualEntry.email || !manualEntry.email.includes('@')) {
      toast({
        variant: 'destructive',
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
      });
      return;
    }

    setPreview([
      ...preview,
      {
        email: manualEntry.email,
        name: manualEntry.name || undefined,
        phone: manualEntry.phone || undefined,
      },
    ]);
    setManualEntry({ email: '', name: '', phone: '' });
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No participants',
        description: 'Please add at least one participant to import.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const participantInserts = preview.map((p) => ({
        study_id: studyId,
        email: p.email,
        name: p.name || null,
        phone: p.phone || null,
        demographics: {
          age: p.age,
          gender: p.gender,
          location: p.location,
        },
        metadata: p.metadata || {},
        status: 'pending',
      }));

      const { error } = await supabase
        .from('participants')
        .insert(participantInserts);

      if (error) {
        throw error;
      }

      toast({
        title: 'Import successful',
        description: `${preview.length} participants imported.`,
      });

      router.push(`/studies/${studyId}`);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        variant: 'destructive',
        title: 'Import failed',
        description: 'Failed to import participants. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Import Participants</h1>
        <p className="text-muted-foreground">
          Add participants to your study from various sources
        </p>
      </div>

      {/* Import Method Selection */}
      <div className="grid gap-4 md:grid-cols-4">
        {(['csv', 'json', 'shopify', 'manual'] as const).map((method) => (
          <button
            key={method}
            onClick={() => {
              setImportMethod(method);
              setPreview([]);
            }}
            className={`rounded-lg border p-4 text-left transition-colors ${
              importMethod === method
                ? 'border-primary bg-primary/5'
                : 'hover:bg-muted'
            }`}
          >
            <div className="text-2xl">
              {method === 'csv' && '📄'}
              {method === 'json' && '{}'}
              {method === 'shopify' && '🛒'}
              {method === 'manual' && '✏️'}
            </div>
            <div className="mt-2 font-medium capitalize">{method}</div>
            <div className="text-sm text-muted-foreground">
              {method === 'csv' && 'Upload CSV file'}
              {method === 'json' && 'Upload JSON file'}
              {method === 'shopify' && 'Connect Shopify'}
              {method === 'manual' && 'Add one by one'}
            </div>
          </button>
        ))}
      </div>

      {/* Import Form */}
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{importMethod} Import</CardTitle>
          <CardDescription>
            {importMethod === 'csv' &&
              'Upload a CSV file with participant data. Must include an email column.'}
            {importMethod === 'json' &&
              'Upload a JSON file with an array of participants.'}
            {importMethod === 'shopify' &&
              'Connect to your Shopify store to import customers.'}
            {importMethod === 'manual' && 'Manually enter participant details.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(importMethod === 'csv' || importMethod === 'json') && (
            <div className="space-y-2">
              <Label htmlFor="file">Upload File</Label>
              <Input
                id="file"
                type="file"
                accept={importMethod === 'csv' ? '.csv' : '.json'}
                onChange={handleFileUpload}
              />
            </div>
          )}

          {importMethod === 'shopify' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="storeUrl">Store URL</Label>
                <Input
                  id="storeUrl"
                  placeholder="your-store.myshopify.com"
                  value={shopifyConfig.storeUrl}
                  onChange={(e) =>
                    setShopifyConfig((prev) => ({
                      ...prev,
                      storeUrl: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="shpat_..."
                  value={shopifyConfig.accessToken}
                  onChange={(e) =>
                    setShopifyConfig((prev) => ({
                      ...prev,
                      accessToken: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Customer Filter</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={shopifyConfig.customerFilter}
                  onChange={(e) =>
                    setShopifyConfig((prev) => ({
                      ...prev,
                      customerFilter: e.target.value,
                    }))
                  }
                >
                  <option value="all">All Customers</option>
                  <option value="recent">Purchased in last 30 days</option>
                  <option value="repeat">Repeat Customers</option>
                  <option value="vip">VIP Customers</option>
                </select>
              </div>
              <Button onClick={handleShopifyImport} disabled={isLoading}>
                {isLoading ? 'Connecting...' : 'Fetch Customers'}
              </Button>
            </>
          )}

          {importMethod === 'manual' && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="participant@example.com"
                    value={manualEntry.email}
                    onChange={(e) =>
                      setManualEntry((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={manualEntry.name}
                    onChange={(e) =>
                      setManualEntry((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+1234567890"
                    value={manualEntry.phone}
                    onChange={(e) =>
                      setManualEntry((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <Button variant="outline" onClick={handleManualAdd}>
                + Add to List
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview ({preview.length} participants)</CardTitle>
            <CardDescription>
              Review the participants before importing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="py-2 text-left font-medium">Email</th>
                    <th className="py-2 text-left font-medium">Name</th>
                    <th className="py-2 text-left font-medium">Phone</th>
                    <th className="py-2 text-left font-medium">Demographics</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 50).map((p, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{p.email}</td>
                      <td className="py-2">{p.name || '-'}</td>
                      <td className="py-2">{p.phone || '-'}</td>
                      <td className="py-2 text-muted-foreground">
                        {[p.age, p.gender, p.location]
                          .filter(Boolean)
                          .join(', ') || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 50 && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Showing 50 of {preview.length} participants
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/studies/${studyId}`)}
        >
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          disabled={preview.length === 0 || isLoading}
        >
          {isLoading ? 'Importing...' : `Import ${preview.length} Participants`}
        </Button>
      </div>
    </div>
  );
}
