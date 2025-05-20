"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, X, Clock, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryPanelProps {
  history: any[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function HistoryPanel({
  history,
  isOpen,
  setIsOpen,
}: HistoryPanelProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case "ping":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "tools":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "chat":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (!isOpen) {
    return (
      <div className="border-l border-border bg-white dark:bg-zinc-950 flex flex-col items-center py-4 w-12">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 mb-4"
          onClick={() => setIsOpen(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center gap-4 mt-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div className="rotate-90 text-xs font-medium text-muted-foreground">
            History
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-border bg-white dark:bg-zinc-950 flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold">History</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No history yet. Start by executing an action.
            </div>
          ) : (
            history.map((item, index) => (
              <Card
                key={index}
                className={cn(
                  "overflow-hidden cursor-pointer border-l-4",
                  expandedItems[`item-${index}`]
                    ? "border-l-primary"
                    : "border-l-transparent"
                )}
                onClick={() => toggleItem(`item-${index}`)}
              >
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Badge
                      className={cn("font-normal", getActionColor(item.type))}
                    >
                      {item.type}
                    </Badge>
                    <div className="truncate text-sm font-medium">
                      {item.title}
                    </div>
                  </div>
                  {expandedItems[`item-${index}`] ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  )}
                </div>

                {expandedItems[`item-${index}`] && (
                  <div className="p-3 pt-0 text-sm border-t border-border bg-muted/50">
                    <div className="text-xs text-muted-foreground mb-2">
                      {new Date().toLocaleTimeString()}
                    </div>
                    <pre className="whitespace-pre-wrap text-xs font-mono">
                      {JSON.stringify(item.details, null, 2)}
                    </pre>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
