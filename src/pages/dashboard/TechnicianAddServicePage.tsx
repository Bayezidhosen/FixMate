import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Upload, PlusCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout.tsx';
import { SafeImage } from '../../components/SafeImage.tsx';
import { SERVICE_CATEGORIES, SERVICE_MODES } from '../../shared/types.ts';

const serviceSchema = z.object({
  title: z.string().trim().min(4, 'Title must be at least 4 characters.'),
  category: z.enum(SERVICE_CATEGORIES),
  description: z.string().trim().min(20, 'Description must be at least 20 characters.'),
  basePrice: z.coerce.number().positive('Base price must be greater than zero.'),
  estimatedDuration: z.string().trim().min(2, 'Estimated duration is required.'),
  serviceMode: z.enum(SERVICE_MODES),
  serviceArea: z.string().trim().min(2, 'Service area is required.'),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export function TechnicianAddServicePage() {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState('/src/assets/images/service_smartphone_1795006392558.jpg');
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema) as any,
    defaultValues: {
      category: 'Smartphone',
      serviceMode: 'Home Visit',
      estimatedDuration: '60 mins',
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Image must be under 4 MB.');
      return;
    }
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('File read error.'));
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
      setImageUrl(data.url);
      toast.success('Service image uploaded.');
    } catch {
      toast.error('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: ServiceFormValues) => {
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...values, image: imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not publish service.');
        return;
      }
      toast.success('Service submitted for Admin approval.');
      navigate('/dashboard/technician/my-services');
    } catch {
      toast.error('Network error submitting service.');
    }
  };

  return (
    <DashboardLayout allowedRoles={['technician']} title="Add Repair Service">
      <div className="max-w-3xl bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5">
              Service Title
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g., iPhone 15 Pro OLED Display Replacement"
              className="w-full h-11 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
            />
            {errors.title && (
              <p className="text-xs text-rose-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5">
                Category
              </label>
              <select
                {...register('category')}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm"
              >
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5">
                Service Mode
              </label>
              <select
                {...register('serviceMode')}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm"
              >
                {SERVICE_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5">
                Base Price (USD)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('basePrice')}
                placeholder="99"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm tabular-nums"
              />
              {errors.basePrice && (
                <p className="text-xs text-rose-600 mt-1">{errors.basePrice.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5">
                Estimated Duration
              </label>
              <input
                type="text"
                {...register('estimatedDuration')}
                placeholder="60 mins"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm"
              />
              {errors.estimatedDuration && (
                <p className="text-xs text-rose-600 mt-1">{errors.estimatedDuration.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5">
                Service Area
              </label>
              <input
                type="text"
                {...register('serviceArea')}
                placeholder="Downtown & Westside"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm"
              />
              {errors.serviceArea && (
                <p className="text-xs text-rose-600 mt-1">{errors.serviceArea.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5">
              Description (min 20 characters)
            </label>
            <textarea
              rows={4}
              {...register('description')}
              placeholder="Detail diagnostics included, warranty terms, and supported device models..."
              className="w-full p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
            />
            {errors.description && (
              <p className="text-xs text-rose-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* ImgBB Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200">
              Service Cover Image
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-36 aspect-4/3 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
                <SafeImage src={imageUrl} alt="Service preview" className="w-full h-full object-cover" />
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Upload className="w-4 h-4 text-[#3867FF]" />
                <span>{uploading ? 'Uploading...' : 'Upload Service Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || uploading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#3867FF] hover:bg-[#2B54DB] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Publishing...' : 'Submit Service for Approval'}</span>
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
