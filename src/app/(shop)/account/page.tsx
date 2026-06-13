"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, MapPin, ShoppingBag, LogOut, ChevronRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { logout } from "@/services/authService";
import { changePassword, updateProfile } from "@/services/userService";
import { toast } from "sonner";

export default function AccountPage() {
  const router = useRouter();
  const { user, setUser, clearUser } = useAuthStore();

  const [editOpen, setEditOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", mobile: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile ?? "",
      });
    }
  }, [user]);

  if (!user) return null;

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    clearUser();
    router.push("/");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        mobile: profileForm.mobile || undefined,
      });
      setUser(updated);
      setEditOpen(false);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setSavingPw(true);
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwOpen(false);
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success("Password changed");
    } catch {
      toast.error("Failed to change password — check your current password");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-heading text-2xl font-bold sm:text-3xl">My Account</h1>

      {/* Profile card */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex size-12 sm:size-16 shrink-0 items-center justify-center rounded-full bg-primary text-base sm:text-xl font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="flex flex-1 flex-col gap-0.5 min-w-0">
            <p className="font-semibold text-foreground text-base sm:text-lg truncate">
              {user.firstName} {user.lastName}
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="truncate text-xs sm:text-sm">{user.email}</span>
              {user.isEmailVerified && (
                <CheckCircle2 className="size-3 sm:size-3.5 shrink-0 text-emerald-500" />
              )}
            </div>
            {user.mobile && (
              <p className="text-xs sm:text-sm text-muted-foreground">{user.mobile}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 text-xs sm:text-sm"
            onClick={() => { setEditOpen((v) => !v); setPwOpen(false); }}
          >
            {editOpen ? "Cancel" : "Edit"}
          </Button>
        </div>

        {/* Edit profile form */}
        {editOpen && (
          <form onSubmit={handleSaveProfile} className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">First Name</label>
                <input
                  className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                  required maxLength={100}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Last Name</label>
                <input
                  className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                  required maxLength={100}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Mobile</label>
              <input
                className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={profileForm.mobile}
                onChange={(e) => setProfileForm((p) => ({ ...p, mobile: e.target.value }))}
                placeholder="Optional"
                maxLength={15}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditOpen(false)} disabled={savingProfile}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={savingProfile}>
                {savingProfile ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Quick links — mobile only (desktop sidebar handles nav) */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:hidden">
        {[
          { href: "/account/addresses", icon: MapPin, label: "Addresses", desc: "Delivery addresses" },
          { href: "/orders", icon: ShoppingBag, label: "Orders", desc: "Track & manage" },
          { href: "/wishlist", icon: Heart, label: "Wishlist", desc: "Saved items" },
        ].map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
          >
            <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon className="size-4 sm:size-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">{label}</span>
              <span className="text-xs text-muted-foreground">{desc}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Change password */}
      <div className="mt-4 rounded-xl border border-border bg-card">
        <button
          className="flex w-full items-center justify-between px-4 sm:px-5 py-4 text-sm font-medium"
          onClick={() => { setPwOpen((v) => !v); setEditOpen(false); }}
        >
          Change Password
          <ChevronRight className={`size-4 text-muted-foreground transition-transform ${pwOpen ? "rotate-90" : ""}`} />
        </button>

        {pwOpen && (
          <form onSubmit={handleChangePassword} className="flex flex-col gap-3 border-t border-border px-4 sm:px-5 pb-5 pt-4">
            {(["currentPassword", "newPassword", "confirm"] as const).map((field) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {field === "currentPassword" ? "Current Password" : field === "newPassword" ? "New Password" : "Confirm New Password"}
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring pr-10"
                    value={pwForm[field]}
                    onChange={(e) => setPwForm((p) => ({ ...p, [field]: e.target.value }))}
                    required
                    minLength={field === "currentPassword" ? 1 : 8}
                    placeholder={field === "newPassword" ? "Min 8 chars, uppercase, number, symbol" : ""}
                  />
                  {field === "confirm" && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPw((v) => !v)}
                    >
                      {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setPwOpen(false)} disabled={savingPw}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={savingPw}>
                {savingPw ? "Changing…" : "Change Password"}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Logout — mobile only (desktop sidebar has it) */}
      <div className="mt-6 lg:hidden">
        <Button
          variant="outline"
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="size-4 mr-2" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
