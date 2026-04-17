"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Tag,
  UserCircle,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { getCategories, getHosts, getMeetings, getUsers, getSyncLogs } from "@/lib/api";
import type { SyncLog } from "@/lib/types";

interface Stats {
  meetings: number;
  activeMeetings: number;
  categories: number;
  hosts: number;
  users: number;
  lastSync: SyncLog | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      getMeetings({ include_inactive: true }),
      getCategories(true),
      getHosts(true),
      getUsers(),
      getSyncLogs(0, 1),
    ]).then(([meetings, cats, hosts, users, logs]) => {
      setStats({
        meetings: meetings.length,
        activeMeetings: meetings.filter((m) => m.is_active).length,
        categories: cats.filter((c) => c.is_active).length,
        hosts: hosts.filter((h) => h.is_active).length,
        users: users.length,
        lastSync: logs[0] ?? null,
      });
    });
  }, []);

  const cards = stats
    ? [
        {
          label: "Active Meetings",
          value: stats.activeMeetings,
          sub: `${stats.meetings} total`,
          icon: CalendarDays,
          href: "/admin/meetings",
          color: "bg-primary-light text-primary",
        },
        {
          label: "Categories",
          value: stats.categories,
          sub: "active",
          icon: Tag,
          href: "/admin/categories",
          color: "bg-secondary-light text-secondary",
        },
        {
          label: "Hosts",
          value: stats.hosts,
          sub: "active",
          icon: UserCircle,
          href: "/admin/hosts",
          color: "bg-success-bg text-success",
        },
        {
          label: "Users",
          value: stats.users,
          sub: "portal access",
          icon: Users,
          href: "/admin/users",
          color: "bg-warning-bg text-warning",
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">
          Overview of your meetings portal
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats === null
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-surface p-5 animate-pulse h-28"
              />
            ))
          : cards.map(({ label, value, sub, icon: Icon, href, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Link
                  href={href}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 hover:shadow-md transition-shadow"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text">{value}</p>
                    <p className="text-sm font-medium text-text">{label}</p>
                    <p className="text-xs text-text-muted">{sub}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
      </div>

      {/* Last sync */}
      {stats?.lastSync && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-surface p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-text flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-text-muted" />
              Last HubSpot Sync
            </h2>
            <Link
              href="/admin/sync"
              className="text-xs text-primary hover:underline font-medium"
            >
              View all →
            </Link>
          </div>
          <SyncStatusRow log={stats.lastSync} />
        </motion.div>
      )}

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-border bg-surface p-5"
      >
        <h2 className="font-semibold text-text mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/admin/sync", label: "Sync HubSpot", icon: RefreshCw },
            { href: "/admin/categories", label: "Add Category", icon: Tag },
            { href: "/admin/hosts", label: "Manage Hosts", icon: UserCircle },
            { href: "/admin/users", label: "Add User", icon: Users },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-text-muted hover:bg-surface-2 hover:text-text transition-colors"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function SyncStatusRow({ log }: { log: SyncLog }) {
  const statusConfig = {
    success: {
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success-bg",
      label: "Success",
    },
    failed: {
      icon: XCircle,
      color: "text-error",
      bg: "bg-error-bg",
      label: "Failed",
    },
    running: {
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning-bg",
      label: "Running",
    },
  };
  const cfg = statusConfig[log.status];
  const Icon = cfg.icon;

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.color}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {cfg.label}
      </span>
      <span className="text-text-muted">
        {new Date(log.started_at).toLocaleString()}
      </span>
      <span className="text-text">+{log.links_added} added</span>
      <span className="text-text">{log.links_updated} updated</span>
      <span className="text-text">{log.links_deactivated} deactivated</span>
      {log.error_message && (
        <span className="text-error text-xs">{log.error_message}</span>
      )}
    </div>
  );
}
