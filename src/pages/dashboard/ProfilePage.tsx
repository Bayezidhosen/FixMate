import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Upload, Save } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout.tsx';
import { SafeImage } from '../../components/SafeImage.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export function ProfilePage() {
  const { user, setUserDirect } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setArea(user.area || '');
      setBio(user.bio || '');
      setImage(user.image || '');
    }
  }, [user]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Image must be smaller than 4 MB.');
      return;
    }

    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read file.'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageBase64: base64, fileName: file.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Image upload failed.');
        return;
      }
      setImage(data.url);
      toast.success('Profile photo uploaded.');
    } catch {
      toast.error('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, phone, area, bio, image }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update profile.');
        return;
      }
      // Immediately update AuthContext so Navbar avatar, name, and Dashboard refresh without re-login
      setUserDirect(data.user);
      toast.success('Profile updated successfully.');
    } catch {
      toast.error('Network error saving profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={['customer', 'technician', 'admin']} title="Update Profile">
      <div className="max-w-2xl bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
              {image ? (
                <SafeImage src={image} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#101B35] dark:bg-[#3867FF] text-white font-bold text-xl flex items-center justify-center">
                  {name
                    .split(' ')
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'FM'}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold text-[#101B35] dark:text-white">Profile Photo</p>
              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Upload className="w-3.5 h-3.5 text-[#3867FF]" />
                <span>{uploading ? 'Uploading...' : 'Upload New Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={uploading}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#68758A] dark:text-slate-400 mb-1">
                Email (Read-Only)
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/70 text-sm text-[#68758A] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#68758A] dark:text-slate-400 mb-1">
                Account Role (Read-Only)
              </label>
              <input
                type="text"
                value={user?.role || ''}
                readOnly
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/70 text-sm text-[#68758A] capitalize cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (415) 555-0142"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1">
              Neighborhood / Service Area
            </label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Downtown / Metro North"
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1">
              Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share a short summary about yourself or your technical experience..."
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
            />
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#3867FF] hover:bg-[#2B54DB] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
