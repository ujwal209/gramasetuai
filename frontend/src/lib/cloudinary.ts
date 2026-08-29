/**
 * Cloudinary Direct Client-Side Unsigned Image & Audio Uploader
 */

const CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dcp3r3dc3';

const UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'docmosis_avatars';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export async function uploadToCloudinary(
  file: File,
  folder: string = 'gramsetu_farmers'
): Promise<CloudinaryUploadResult> {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const errorMsg =
      errData?.error?.message || `Upload failed with status: ${res.status}`;
    throw new Error(errorMsg);
  }

  const data = await res.json();
  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
    format: data.format,
    width: data.width,
    height: data.height,
  };
}

/**
 * Upload audio file or base64 data URI to Cloudinary (under video/auto resource type)
 */
export async function uploadAudioToCloudinary(
  audioData: Blob | string,
  folder: string = 'vani_conversations'
): Promise<CloudinaryUploadResult> {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`;
  const formData = new FormData();

  if (typeof audioData === 'string') {
    // base64 string
    const dataUri = audioData.startsWith('data:')
      ? audioData
      : `data:audio/mp3;base64,${audioData}`;
    formData.append('file', dataUri);
  } else {
    // Blob
    const file = new File([audioData], `vani_${Date.now()}.mp3`, {
      type: audioData.type || 'audio/mp3',
    });
    formData.append('file', file);
  }

  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    // Fallback try raw upload
    const rawUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
    const resRaw = await fetch(rawUrl, {
      method: 'POST',
      body: formData,
    });
    if (!resRaw.ok) {
      const errData = await resRaw.json().catch(() => ({}));
      const errorMsg =
        errData?.error?.message || `Audio upload failed with status: ${res.status}`;
      throw new Error(errorMsg);
    }
    const rawData = await resRaw.json();
    return {
      secure_url: rawData.secure_url,
      public_id: rawData.public_id,
      format: rawData.format,
      duration: rawData.duration,
    };
  }

  const data = await res.json();
  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
    format: data.format,
    duration: data.duration,
  };
}

/**
 * Upload statutory PDF document to Cloudinary
 */
export async function uploadPdfToCloudinary(
  pdfFile: File | Blob,
  fileName: string = 'gazette.pdf',
  folder: string = 'nitirag_gazettes'
): Promise<CloudinaryUploadResult> {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`;
  const formData = new FormData();
  const fileToUpload = pdfFile instanceof File ? pdfFile : new File([pdfFile], fileName, { type: 'application/pdf' });
  
  formData.append('file', fileToUpload);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    // Fallback to auto/upload
    const autoUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
    const resAuto = await fetch(autoUrl, {
      method: 'POST',
      body: formData,
    });
    if (!resAuto.ok) {
      const errData = await resAuto.json().catch(() => ({}));
      const errorMsg = errData?.error?.message || `PDF upload failed with status: ${resAuto.status}`;
      throw new Error(errorMsg);
    }
    const autoData = await resAuto.json();
    return {
      secure_url: autoData.secure_url,
      public_id: autoData.public_id,
      format: autoData.format || 'pdf',
    };
  }

  const data = await res.json();
  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
    format: data.format || 'pdf',
  };
}

