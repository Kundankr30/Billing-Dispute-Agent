"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EmailLog } from "@/lib/types";
import { Mail, Clock } from "lucide-react";

interface EmailThreadProps {
  emails: EmailLog[];
}

export function EmailThread({ emails }: EmailThreadProps) {
  const safeEmails = emails ?? [];
  if (safeEmails.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Email History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Mail className="mb-2 h-10 w-10 opacity-50" />
            <p>No emails have been sent yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Email History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-4">
            {safeEmails.map((email, idx) => (
              <div key={email.id}>
                {idx > 0 && <Separator className="my-4" />}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {email.email_type}
                      </Badge>
                      {email.status && (
                        <Badge variant="secondary" className="text-xs">
                          {email.status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(email.sent_at)}
                    </div>
                  </div>
                  <p className="font-semibold">{email.subject}</p>
                  <div
                    className="rounded-lg border bg-muted/30 p-3 text-sm"
                    dangerouslySetInnerHTML={{
                      __html: (email.body ?? "").replace(/\n/g, "<br />"),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
