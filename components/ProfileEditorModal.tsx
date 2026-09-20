"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getUserProfile, updateUserProfile } from "@/lib/users";
import { updateEventAttendeeProfile } from "@/lib/events";
import { useAuth } from "@/components/AuthProvider";
import { FiX, FiGithub, FiLinkedin, FiTwitter, FiInstagram, FiFacebook, FiYoutube, FiGlobe } from "react-icons/fi";
import { useParams } from "next/navigation";

export function ProfileEditorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const params = useParams();
  const eventId = params.id as string | undefined;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    displayName: "",
    github: "",
    linkedin: "",
    twitter: "",
    instagram: "",
    facebook: "",
    youtube: "",
    website: "",
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !user) return;
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getUserProfile(user.uid).then((profile) => {
      if (profile) {
        setFormData({
          displayName: profile.displayName || "",
          github: profile.socials?.github || "",
          linkedin: profile.socials?.linkedin || "",
          twitter: profile.socials?.twitter || "",
          instagram: profile.socials?.instagram || "",
          facebook: profile.socials?.facebook || "",
          youtube: profile.socials?.youtube || "",
          website: profile.socials?.website || "",
        });
      }
      setLoading(false);
    });
  }, [isOpen, user]);

  if (!isOpen || !user || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updateData = {
        displayName: formData.displayName,
        socials: {
          github: formData.github,
          linkedin: formData.linkedin,
          twitter: formData.twitter,
          instagram: formData.instagram,
          facebook: formData.facebook,
          youtube: formData.youtube,
          website: formData.website,
        },
      };

      await updateUserProfile(user.uid, updateData);
      if (eventId) {
        // Update in event attendees subcollection as well if they are on an event page
        await updateEventAttendeeProfile(eventId, user.uid, updateData);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 md:p-8 border border-zinc-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
        >
          <FiX className="size-5" />
        </button>
        
        <h2 className="text-xl font-bold text-zinc-900 mb-6">Edit Profile</h2>

        {loading ? (
          <p className="text-sm text-zinc-500 text-center py-10">Loading profile...</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Display Name</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                placeholder="Your full name"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                  <FiGithub className="size-4" /> GitHub
                </label>
                <input
                  type="text"
                  value={formData.github}
                  onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="https://github.com/..."
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                  <FiLinkedin className="size-4" /> LinkedIn
                </label>
                <input
                  type="text"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                  <FiTwitter className="size-4" /> Twitter / X
                </label>
                <input
                  type="text"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="https://twitter.com/..."
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                  <FiInstagram className="size-4" /> Instagram
                </label>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                  <FiFacebook className="size-4" /> Facebook
                </label>
                <input
                  type="text"
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                  <FiYoutube className="size-4" /> YouTube
                </label>
                <input
                  type="text"
                  value={formData.youtube}
                  onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                  <FiGlobe className="size-4" /> Website
                </label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-2 w-full rounded-xl bg-orange-600 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
