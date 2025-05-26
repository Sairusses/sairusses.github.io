import { supabase } from "./supabase"

export async function uploadFile(file: File, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("manpower-files").upload(path, file)

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data: urlData } = supabase.storage.from("manpower-files").getPublicUrl(data.path)

  return urlData.publicUrl
}

export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabase.storage.from("manpower-files").remove([path])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

export async function downloadFile(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from("manpower-files").download(path)

  if (error) {
    throw new Error(`Download failed: ${error.message}`)
  }

  return data
}
