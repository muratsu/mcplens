"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function SettingsAction() {
  const [apiKey, setApiKey] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showApiKey, setShowApiKey] = useState<boolean>(false)

  // Load API key when component mounts
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const key = await window.getOpenAIKey()
        setApiKey(key || '')
        setLoading(false)
      } catch (error) {
        console.error('Failed to load API key:', error)
        setLoading(false)
      }
    }

    loadApiKey()
  }, [])

  const handleSave = async () => {
    try {
      await window.setOpenAIKey(apiKey)
      setSaveStatus('success')

      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    } catch (error) {
      console.error('Failed to save API key:', error)
      setSaveStatus('error')
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>OpenAI API Key</CardTitle>
          <CardDescription>
            <p>Your API key is stored on your local machine and is required for AI features.</p>
            <p className="mt-4">
              <span className="font-semibold">Note:</span> You don't need to enter your API key here if you have <code className="font-mono bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1 py-0.5 rounded">OPENAI_API_KEY</code> set in your environment variables.
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white"></div>
              <span>Loading...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="font-mono pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowApiKey(!showApiKey)}
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {saveStatus === 'success' && (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-600 dark:text-green-400">
                    API key saved successfully.
                  </AlertDescription>
                </Alert>
              )}

              {saveStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to save API key. Please try again.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full"
          >
            Save API Key
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}