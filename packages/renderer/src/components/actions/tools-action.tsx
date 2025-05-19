"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Wrench, RefreshCw, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ServerDetails, HistoryEntry } from "@/types/server";
import { useServerPort } from "@/lib/utils";

interface ToolsActionProps {
  server: ServerDetails;
  addToHistory: (entry: HistoryEntry) => void;
}

interface PropertyValue {
  description?: string;
  type?: string;
  [key: string]: unknown;
}

interface Tool {
  name: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, PropertyValue>;
    required?: string[];
  } & Record<string, unknown>;
  outputSchema?: {
    type: "object";
    properties?: Record<string, PropertyValue>;
    required?: string[];
  } & Record<string, unknown>;
  annotations?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ToolResult {
  loading?: boolean;
  data?: unknown;
  error?: string;
}

export function ToolsAction({ server, addToHistory }: ToolsActionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tools, setTools] = useState<Tool[] | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<
    Record<string, Record<string, string>>
  >({});
  const [results, setResults] = useState<Record<string, ToolResult>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const serverPort = useServerPort();

  // Reset state when server changes
  useEffect(() => {
    setTools(null);
    setSelectedTool(null);
    setFormValues({});
    setResults({});
    setSearchQuery("");
    setSelectedCategory("all");
  }, [server.id]);

  const fetchTools = async () => {
    if (!serverPort) return;

    setIsLoading(true);
    setTools(null);

    try {
      const response = await fetch(`http://localhost:${serverPort}/api/tools`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: server.name,
          command: server.command,
          args: server.args,
          env: server.env || {},
          transportType: server.transportType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch tools");
      }

      const toolsData = (await response.json()).tools;
      setTools(toolsData);

      // Initialize form values
      const initialFormValues: Record<string, Record<string, string>> = {};
      toolsData.forEach((tool: Tool) => {
        initialFormValues[tool.name] = {};
        const properties = tool.inputSchema.properties || {};
        Object.keys(properties).forEach((propKey) => {
          initialFormValues[tool.name][propKey] = "";
        });
      });
      setFormValues(initialFormValues);

      // Add to history
      addToHistory({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        serverId: server.id,
        type: "tools",
        title: `Fetched Tools from ${server.name}`,
        status: "success",
        details: {
          server: server.url || `${server.command} ${server.args}`,
          toolsCount: toolsData.length,
          tools: toolsData.map((t: Tool) => t.name),
        },
      });
    } catch (error) {
      // Add to history
      addToHistory({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        serverId: server.id,
        type: "tools",
        title: `Failed to Fetch Tools from ${server.name}`,
        status: "error",
        details: {
          server: server.url || `${server.command} ${server.args}`,
          error:
            error instanceof Error ? error.message : "Failed to fetch tools",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    toolId: string,
    propKey: string,
    value: string
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [toolId]: {
        ...prev[toolId],
        [propKey]: value,
      },
    }));
  };

  const executeTool = async (toolId: string) => {
    const tool = tools?.find((t) => t.name === toolId);
    if (!tool || !serverPort) return;

    setResults((prev) => ({
      ...prev,
      [toolId]: { loading: true },
    }));

    try {
      const response = await fetch(`http://localhost:${serverPort}/api/exec`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serverDetails: {
            name: server.name,
            command: server.command,
            args: server.args,
            env: server.env || {},
            transportType: server.transportType,
          },
          toolId,
          inputs: formValues[toolId],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to execute tool");
      }

      const result = await response.json();

      setResults((prev) => ({
        ...prev,
        [toolId]: { data: result, loading: false },
      }));

      // Add to history
      addToHistory({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        serverId: server.id,
        type: "tools",
        title: `Executed Tool: ${tool.name}`,
        status: "success",
        details: {
          server: server.url || `${server.command} ${server.args}`,
          tool: tool.name,
          inputs: formValues[toolId],
          result,
        },
      });
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [toolId]: {
          error:
            error instanceof Error ? error.message : "Failed to execute tool",
          loading: false,
        },
      }));

      // Add to history
      addToHistory({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        serverId: server.id,
        type: "tools",
        title: `Failed to Execute Tool: ${tool.name}`,
        status: "error",
        details: {
          server: server.url || `${server.command} ${server.args}`,
          tool: tool.name,
          inputs: formValues[toolId],
          error:
            error instanceof Error ? error.message : "Failed to execute tool",
        },
      });
    }
  };

  // Get unique categories
  const categories = tools
    ? ["all", ...new Set(tools.map((tool) => (tool.annotations?.category as string) || "uncategorized"))]
    : ["all"];

  // Filter tools based on search and category
  const filteredTools = tools
    ? tools.filter((tool) => {
        const matchesSearch =
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (tool.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());

        const matchesCategory =
          selectedCategory === "all" || (tool.annotations?.category as string) === selectedCategory;

        return matchesSearch && matchesCategory;
      })
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-purple-500" />
          <CardTitle>Server Tools</CardTitle>
        </div>
        <CardDescription>
          Discover and use tools available on this MCP server
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!tools ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">
              Fetch available tools from the server to get started
            </p>
            <Button
              onClick={fetchTools}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              {isLoading ? "Fetching Tools..." : "Fetch Tools"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tools..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted p-2 border-b">
                  <h3 className="font-medium text-sm">
                    Available Tools ({filteredTools.length})
                  </h3>
                </div>
                <div className="p-2 space-y-1">
                  {filteredTools.length > 0 ? (
                    filteredTools.map((tool) => (
                      <Button
                        key={tool.name}
                        variant={
                          selectedTool === tool.name ? "secondary" : "ghost"
                        }
                        className={`w-full justify-start text-left h-auto py-2 px-3 ${
                          selectedTool === tool.name
                            ? "bg-secondary/50 hover:bg-secondary/60"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setSelectedTool(tool.name)}
                      >
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2">
                            <span>{tool.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {(tool.annotations?.category as string) || "uncategorized"}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground mt-1">
                            {tool.description || "No description available"}
                          </span>
                        </div>
                      </Button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No tools match your search
                    </div>
                  )}
                </div>
              </div>

              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted p-2 border-b">
                  <h3 className="font-medium text-sm">Tool Details</h3>
                </div>
                <div className="p-4">
                  {selectedTool ? (
                    (() => {
                      const tool = tools.find((t) => t.name === selectedTool);
                      if (!tool) return null;

                      return (
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium text-lg">
                              {tool.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {tool.description || "No description available"}
                            </p>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-sm font-medium">
                              Parameters
                            </h4>

                            {Object.entries(tool.inputSchema.properties || {}).map(
                              ([propKey, propValue]) => (
                                <div key={propKey} className="space-y-2">
                                  <Label htmlFor={`${tool.name}-${propKey}`}>
                                    {propKey}{" "}
                                    {tool.inputSchema.required?.includes(propKey) && (
                                      <span className="text-red-500">*</span>
                                    )}
                                  </Label>
                                  <Input
                                    id={`${tool.name}-${propKey}`}
                                    placeholder={typeof propValue === 'object' && propValue !== null ? (propValue as PropertyValue).description || "" : ""}
                                    value={
                                      formValues[tool.name]?.[propKey] || ""
                                    }
                                    onChange={(e) =>
                                      handleInputChange(
                                        tool.name,
                                        propKey,
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              )
                            )}

                            {/* <Button
                              onClick={() => executeTool(tool.name)}
                              disabled={results[tool.name]?.loading}
                              className="w-full mt-2"
                            >
                              {results[tool.name]?.loading ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Executing...
                                </>
                              ) : (
                                "Execute Tool"
                              )}
                            </Button> */}
                          </div>

                          {results[tool.name] && !results[tool.name].loading && (
                            <Accordion
                              type="single"
                              collapsible
                              className="w-full"
                            >
                              <AccordionItem value="results">
                                <AccordionTrigger>Results</AccordionTrigger>
                                <AccordionContent>
                                  <pre className="bg-muted p-4 rounded-md text-xs font-mono whitespace-pre-wrap">
                                    {JSON.stringify(
                                      results[tool.name].data ||
                                        results[tool.name].error,
                                      null,
                                      2
                                    )}
                                  </pre>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Select a tool to view details
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
