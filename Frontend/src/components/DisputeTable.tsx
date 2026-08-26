"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { DisputeForm } from "@/components/DisputeForm";
import { api } from "@/lib/api";
import type { Dispute } from "@/lib/types";
import { toast } from "sonner";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Mail,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileX2,
} from "lucide-react";

type FilterTab = "all" | "active" | "resolved" | "escalated";

export function DisputeTable() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [sortField, setSortField] = useState<string>("filed_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fetchDisputes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        per_page: perPage.toString(),
        sort: sortField,
        order: sortDir,
      };
      if (filter !== "all") {
        params.filter = filter;
      }
      const res = await api.disputes.list(params);
      setDisputes(res.disputes ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load disputes."
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, filter, sortField, sortDir]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function handleFilterChange(tab: string) {
    setFilter(tab as FilterTab);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={handleFilterChange}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="escalated">Escalated</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Dispute
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 gap-1"
                    onClick={() => handleSort("vendor_name")}
                  >
                    Vendor <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 gap-1"
                    onClick={() => handleSort("amount")}
                  >
                    Amount <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 gap-1"
                    onClick={() => handleSort("filed_date")}
                  >
                    Filed Date <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Next Action</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : disputes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-40 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileX2 className="h-10 w-10 text-muted-foreground/50" />
                      <p>No disputes yet — create your first one!</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 gap-2"
                        onClick={() => setCreateOpen(true)}
                      >
                        <Plus className="h-4 w-4" /> Add Dispute
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                disputes.map((dispute) => (
                  <TableRow
                    key={dispute.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/disputes/${dispute.id}`)}
                  >
                    <TableCell className="font-medium">
                      {dispute.vendor_name}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(dispute.amount, dispute.currency)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={dispute.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(dispute.filed_date)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dispute.next_action ?? "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            />
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/disputes/${dispute.id}`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          {dispute.status === "new" && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/disputes/${dispute.id}`);
                              }}
                            >
                              <Mail className="mr-2 h-4 w-4" /> Generate Email
                            </DropdownMenuItem>
                          )}
                          {dispute.status !== "resolved" &&
                            dispute.status !== "closed" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/disputes/${dispute.id}`);
                                }}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" /> Mark
                                Resolved
                              </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {total > perPage && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * perPage + 1}–
            {Math.min(page * perPage, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <DisputeForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchDisputes}
      />
    </div>
  );
}
