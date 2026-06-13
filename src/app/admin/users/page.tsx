"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Shield, UserX } from "lucide-react";
import { useAdminUsers, useToggleUserActive } from "@/hooks/useAdmin";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { cn } from "@/lib/utils";

export default function AdminUsersPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useAdminUsers(page);
  const toggleActive = useToggleUserActive();

  async function handleToggle(id: string, currentlyActive: boolean) {
    try {
      await toggleActive.mutateAsync(id);
      toast.success(currentlyActive ? "User deactivated" : "User activated");
    } catch {
      toast.error("Failed to update user");
    }
  }

  const users = data?.content ?? [];

  return (
    <div className="p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-bold">Users</h1>

      <div className="rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : users.map((user) => {
                    const isAdmin = user.roles.includes("ROLE_ADMIN");
                    return (
                      <tr key={user.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {user.mobile ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          {isAdmin ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-rose-600">
                              <Shield className="size-3" /> Admin
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Customer</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                              user.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            )}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          {!isAdmin && (
                            <button
                              onClick={() => handleToggle(user.id, user.isActive)}
                              disabled={toggleActive.isPending}
                              className={cn(
                                "flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                                user.isActive
                                  ? "border-red-200 text-red-600 hover:bg-red-50"
                                  : "border-green-200 text-green-600 hover:bg-green-50"
                              )}
                            >
                              <UserX className="size-3" />
                              {user.isActive ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Page {page + 1} of {data.totalPages} ({data.totalElements} users)
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="rounded border px-3 py-1 disabled:opacity-40 hover:border-rose-400">Prev</button>
              <button onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))} disabled={page >= data.totalPages - 1}
                className="rounded border px-3 py-1 disabled:opacity-40 hover:border-rose-400">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
