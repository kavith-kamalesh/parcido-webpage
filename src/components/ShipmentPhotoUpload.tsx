import { useState, useRef } from 'react';
import { Camera, X, Loader2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ShipmentPhotoUploadProps {
  bookingId: string;
  userId: string;
  existingUrl?: string | null;
  type: 'customer' | 'driver';
  onUploaded: (url: string) => void;
  disabled?: boolean;
}

export const ShipmentPhotoUpload = ({
  bookingId,
  userId,
  existingUrl,
  type,
  onUploaded,
  disabled = false,
}: ShipmentPhotoUploadProps) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5 MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${bookingId}_${type}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('shipment-photos')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('shipment-photos')
      .getPublicUrl(path);

    const url = publicUrlData.publicUrl;

    const updatePayload = type === 'customer'
      ? { customer_photo_url: url }
      : { driver_photo_url: url };
    const { error: updateError } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', bookingId);

    setUploading(false);

    if (updateError) {
      toast({ title: 'Save failed', description: updateError.message, variant: 'destructive' });
    } else {
      setPreviewUrl(url);
      onUploaded(url);
      toast({ title: 'Photo uploaded', description: type === 'customer' ? 'Before-shipping photo saved.' : 'After-delivery photo saved.' });
    }

    if (fileRef.current) fileRef.current.value = '';
  };

  const removePhoto = async () => {
    const clearPayload = type === 'customer'
      ? { customer_photo_url: null as string | null }
      : { driver_photo_url: null as string | null };
    await supabase.from('bookings').update(clearPayload).eq('id', bookingId);
    setPreviewUrl(null);
    onUploaded('');
    toast({ title: 'Photo removed' });
  };

  const label = type === 'customer' ? 'Before Shipping Photo' : 'After Delivery Photo';

  return (
    <div className="mt-3">
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {previewUrl ? (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt={label}
            className="h-24 w-24 rounded-lg border border-border object-cover"
          />
          {!disabled && (
            <button
              onClick={removePhoto}
              className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled || uploading}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Camera className="h-5 w-5" />
              <span className="text-[10px]">Upload</span>
            </>
          )}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
