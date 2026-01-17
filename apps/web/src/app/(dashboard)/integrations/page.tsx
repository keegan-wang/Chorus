'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'available';
  config?: Record<string, string>;
}

export default function IntegrationsPage() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'Import customers from your Shopify store',
      icon: '🛒',
      status: 'available',
    },
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'Configure OpenAI API for LLM agents',
      icon: '🤖',
      status: 'available',
    },
    {
      id: 'heygen',
      name: 'HeyGen',
      description: 'Video avatar generation service',
      icon: '🎭',
      status: 'available',
    },
    {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      description: 'Text-to-speech for avatar voices',
      icon: '🔊',
      status: 'available',
    },
    {
      id: 'redis',
      name: 'Redis',
      description: 'Session state and queue management',
      icon: '⚡',
      status: 'available',
    },
  ]);

  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, string>>({});

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigForm(integration.config || {});
  };

  const handleSaveConfig = () => {
    if (!selectedIntegration) return;

    setIntegrations(
      integrations.map((i) =>
        i.id === selectedIntegration.id
          ? { ...i, status: 'connected' as const, config: configForm }
          : i
      )
    );

    toast({
      title: 'Integration connected',
      description: `${selectedIntegration.name} has been configured successfully.`,
    });

    setSelectedIntegration(null);
    setConfigForm({});
  };

  const handleDisconnect = (integrationId: string) => {
    setIntegrations(
      integrations.map((i) =>
        i.id === integrationId
          ? { ...i, status: 'available' as const, config: undefined }
          : i
      )
    );

    toast({
      title: 'Integration disconnected',
      description: 'Integration has been disconnected.',
    });
  };

  const getConfigFields = (integrationId: string) => {
    switch (integrationId) {
      case 'shopify':
        return [
          { key: 'storeUrl', label: 'Store URL', placeholder: 'your-store.myshopify.com' },
          { key: 'accessToken', label: 'Access Token', placeholder: 'shpat_...', type: 'password' },
        ];
      case 'openai':
        return [
          { key: 'apiKey', label: 'API Key', placeholder: 'sk-...', type: 'password' },
          { key: 'model', label: 'Model', placeholder: 'gpt-4' },
        ];
      case 'heygen':
        return [
          { key: 'apiKey', label: 'API Key', placeholder: 'Your HeyGen API key', type: 'password' },
        ];
      case 'elevenlabs':
        return [
          { key: 'apiKey', label: 'API Key', placeholder: 'Your ElevenLabs API key', type: 'password' },
        ];
      case 'redis':
        return [
          { key: 'host', label: 'Host', placeholder: 'localhost' },
          { key: 'port', label: 'Port', placeholder: '6379' },
          { key: 'password', label: 'Password', placeholder: 'Optional', type: 'password' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect external services to power your research platform
        </p>
      </div>

      {/* Integrations Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="text-4xl">{integration.icon}</div>
                {integration.status === 'connected' ? (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    Connected
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                    Available
                  </span>
                )}
              </div>
              <CardTitle>{integration.name}</CardTitle>
              <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {integration.status === 'connected' ? (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleConnect(integration)}
                  >
                    Configure
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => handleDisconnect(integration.id)}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button className="w-full" onClick={() => handleConnect(integration)}>
                  Connect
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Configure {selectedIntegration.name}</CardTitle>
              <CardDescription>
                Enter your {selectedIntegration.name} credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getConfigFields(selectedIntegration.id).map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    type={field.type || 'text'}
                    placeholder={field.placeholder}
                    value={configForm[field.key] || ''}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, [field.key]: e.target.value })
                    }
                  />
                </div>
              ))}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedIntegration(null);
                    setConfigForm({});
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveConfig}>Save Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
