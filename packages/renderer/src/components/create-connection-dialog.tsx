"use client";

import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, Trash2, Info } from "lucide-react";
import { useServerContext } from "@/context/ServerContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface CreateConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServerAdded?: (newServerId: string) => void;
}

type TransportType = "sse" | "stdio" | "streamable-http";

interface EnvironmentValue {
  key: string;
  value: string;
  id: string;
}

export function CreateConnectionDialog({
  open,
  onOpenChange,
  onServerAdded,
}: CreateConnectionDialogProps) {
  const { addServer } = useServerContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    transportType: "stdio" as TransportType,
    // SSE and Streamable HTTP settings
    authentication: {
      headerName: "Authorization",
      bearerToken: "",
    },
    requestTimeout: "30000",
    // Stdio settings
    command: "node",
    arguments: "build/index.js",
    environmentValues: [] as EnvironmentValue[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (
    category: "authentication",
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      if (category === "authentication") {
        return {
          ...prev,
          authentication: {
            ...prev.authentication,
            [field]: value,
          },
        };
      }
      return prev;
    });
  };

  const handleTransportTypeChange = (value: TransportType) => {
    setFormData((prev) => ({ ...prev, transportType: value }));
  };

  const addEnvironmentValue = () => {
    setFormData((prev) => ({
      ...prev,
      environmentValues: [
        ...prev.environmentValues,
        { key: "", value: "", id: Date.now().toString() },
      ],
    }));
  };

  const removeEnvironmentValue = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      environmentValues: prev.environmentValues.filter((env) => env.id !== id),
    }));
  };

  const updateEnvironmentValue = (
    id: string,
    field: "key" | "value",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      environmentValues: prev.environmentValues.map((env) =>
        env.id === id ? { ...env, [field]: value } : env
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      setError("Connection name is required");
      return;
    }

    // Validate transport-specific fields
    if (formData.transportType === "stdio") {
      if (!formData.command.trim()) {
        setError("Command is required for stdio transport");
        return;
      }
    } else {
      // SSE or streamable-http
      if (!formData.url.trim()) {
        setError("URL is required for SSE and Streamable HTTP transports");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Prepare server configuration based on transport type
      const serverConfig: {
        name: string;
        transportType: "stdio" | "sse" | "streamable-http";
        url?: string;
        command?: string;
        args?: string;
        env?: Record<string, string>;
        headers?: Record<string, string>;
        timeout?: number;
      } = {
        name: formData.name.trim(),
        transportType: formData.transportType,
        timeout: parseInt(formData.requestTimeout, 10) || 30000,
      };

      // Add transport-specific properties
      if (formData.transportType === "stdio") {
        serverConfig.command = formData.command;
        serverConfig.args = formData.arguments;

        // Convert environment values array to record
        if (formData.environmentValues.length > 0) {
          const envRecord: Record<string, string> = {};
          formData.environmentValues.forEach((env) => {
            if (env.key.trim()) {
              envRecord[env.key.trim()] = env.value;
            }
          });
          serverConfig.env = envRecord;
        }
      } else {
        // SSE or streamable-http
        serverConfig.url = formData.url.trim();

        // Add authentication header if provided
        if (formData.authentication.bearerToken) {
          serverConfig.headers = {
            [formData.authentication.headerName]:
              formData.authentication.headerName.toLowerCase() ===
              "authorization"
                ? `Bearer ${formData.authentication.bearerToken}`
                : formData.authentication.bearerToken,
          };
        }
      }

      // Save the connection to persistent storage
      const newServer = await addServer(serverConfig);

      // Notify the parent component that a new server was added
      if (onServerAdded && newServer) {
        onServerAdded(newServer.id);
      }

      // Close the dialog
      onOpenChange(false);

      // Reset form
      setFormData({
        name: "",
        url: "",
        transportType: "stdio",
        authentication: {
          headerName: "Authorization",
          bearerToken: "",
        },
        requestTimeout: "30000",
        command: "node",
        arguments: "build/index.js",
        environmentValues: [],
      });
    } catch (err) {
      console.error("Error creating server:", err);
      setError("Failed to create server connection. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Connection</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Connection Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="My MCP Server"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Only show URL field for SSE and Streamable HTTP */}
            {(formData.transportType === "sse" ||
              formData.transportType === "streamable-http") && (
              <div className="space-y-2">
                <Label htmlFor="url">Server URL</Label>
                <Input
                  id="url"
                  name="url"
                  placeholder="mcp://server.example.com"
                  value={formData.url}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Transport Type</Label>
            <RadioGroup
              value={formData.transportType}
              onValueChange={(value) =>
                handleTransportTypeChange(value as TransportType)
              }
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stdio" id="stdio" />
                <Label htmlFor="stdio" className="cursor-pointer">
                  STDIO
                </Label>
              </div>
              <div className="flex items-center space-x-2 opacity-50">
                <RadioGroupItem value="sse" id="sse" disabled />
                <Label htmlFor="sse" className="cursor-pointer">
                  SSE
                </Label>
              </div>
              <div className="flex items-center space-x-2 opacity-50">
                <RadioGroupItem value="streamable-http" id="streamable-http" disabled />
                <Label htmlFor="streamable-http" className="cursor-pointer">
                  Streamable HTTP
                </Label>
              </div>
            </RadioGroup>
            <div className="text-sm text-muted-foreground mt-2">
              <Alert className="py-2 bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-700">
                  SSE & Streamable HTTP coming soon.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Transport-specific settings */}
          {formData.transportType === "sse" ||
          formData.transportType === "streamable-http" ? (
            <div className="space-y-4">
              <div className="border rounded-md p-4 space-y-4">
                <h3 className="text-sm font-medium">Authentication</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="headerName">Header Name</Label>
                    <Input
                      id="headerName"
                      value={formData.authentication.headerName}
                      onChange={(e) =>
                        handleNestedChange(
                          "authentication",
                          "headerName",
                          e.target.value
                        )
                      }
                      placeholder="Authorization"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bearerToken">Bearer Token</Label>
                    <Input
                      id="bearerToken"
                      type="password"
                      value={formData.authentication.bearerToken}
                      onChange={(e) =>
                        handleNestedChange(
                          "authentication",
                          "bearerToken",
                          e.target.value
                        )
                      }
                      placeholder="Enter token"
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded-md p-4 space-y-4">
                <h3 className="text-sm font-medium">Configuration</h3>
                <div className="space-y-2">
                  <Label htmlFor="requestTimeout">Request Timeout (ms)</Label>
                  <Input
                    id="requestTimeout"
                    name="requestTimeout"
                    type="number"
                    value={formData.requestTimeout}
                    onChange={handleChange}
                    placeholder="30000"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-md p-4 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="command">Command</Label>
                    <Input
                      id="command"
                      name="command"
                      value={formData.command}
                      onChange={handleChange}
                      placeholder="node"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arguments">Arguments</Label>
                    <Input
                      id="arguments"
                      name="arguments"
                      value={formData.arguments}
                      onChange={handleChange}
                      placeholder="build/index.js"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Environment Values</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addEnvironmentValue}
                      className="h-8"
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  {formData.environmentValues.length > 0 ? (
                    <div className="space-y-2">
                      {formData.environmentValues.map((env) => (
                        <div key={env.id} className="flex items-center gap-2">
                          <Input
                            placeholder="Key"
                            value={env.key}
                            onChange={(e) =>
                              updateEnvironmentValue(
                                env.id,
                                "key",
                                e.target.value
                              )
                            }
                            className="flex-1"
                          />
                          <Input
                            placeholder="Value"
                            value={env.value}
                            onChange={(e) =>
                              updateEnvironmentValue(
                                env.id,
                                "value",
                                e.target.value
                              )
                            }
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEnvironmentValue(env.id)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-sm text-muted-foreground border rounded-md">
                      No environment values added
                    </div>
                  )}
                </div>
              </div>

              <div className="border rounded-md p-4 space-y-4">
                <h3 className="text-sm font-medium">Configuration</h3>
                <div className="space-y-2">
                  <Label htmlFor="stdioRequestTimeout">
                    Request Timeout (ms)
                  </Label>
                  <Input
                    id="stdioRequestTimeout"
                    name="requestTimeout"
                    type="number"
                    value={formData.requestTimeout}
                    onChange={handleChange}
                    placeholder="30000"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Connection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
