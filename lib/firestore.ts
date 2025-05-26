import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

export interface UserProfile {
  uid: string
  email: string
  role: "client" | "freelancer"
  name?: string
  createdAt: Date
  overview?: string
  skills?: string[]
  resumeUrl?: string
  paymentMethods?: string[]
}

export interface EmploymentHistory {
  id?: string
  userId: string
  company: string
  position: string
  startDate: Date
  endDate?: Date
  description: string
  current: boolean
}

export interface JobPost {
  id?: string
  clientId: string
  title: string
  description: string
  budget: number
  skills: string[]
  status: "open" | "in-progress" | "completed" | "cancelled"
  createdAt: Date
  deadline?: Date
}

// Check if Firestore is available
const checkFirestore = () => {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.")
  }
}

export async function createUserProfile(profile: Omit<UserProfile, "createdAt">) {
  checkFirestore()
  const userRef = doc(db, "users", profile.uid)
  await setDoc(userRef, {
    ...profile,
    createdAt: Timestamp.now(),
  })
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  checkFirestore()
  const userRef = doc(db, "users", uid)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    const data = userSnap.data()
    return {
      ...data,
      createdAt: data.createdAt.toDate(),
    } as UserProfile
  }

  return null
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>) {
  checkFirestore()
  const userRef = doc(db, "users", uid)
  await updateDoc(userRef, updates)
}

export async function addEmploymentHistory(employment: Omit<EmploymentHistory, "id">) {
  checkFirestore()
  const employmentRef = collection(db, "employment")
  const docRef = await addDoc(employmentRef, {
    ...employment,
    startDate: Timestamp.fromDate(employment.startDate),
    endDate: employment.endDate ? Timestamp.fromDate(employment.endDate) : null,
  })
  return docRef.id
}

export async function getEmploymentHistory(userId: string): Promise<EmploymentHistory[]> {
  checkFirestore()
  const q = query(collection(db, "employment"), where("userId", "==", userId), orderBy("startDate", "desc"))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    startDate: doc.data().startDate.toDate(),
    endDate: doc.data().endDate?.toDate() || undefined,
  })) as EmploymentHistory[]
}

export async function updateEmploymentHistory(id: string, updates: Partial<EmploymentHistory>) {
  checkFirestore()
  const employmentRef = doc(db, "employment", id)
  const updateData = { ...updates }

  if (updates.startDate) {
    updateData.startDate = Timestamp.fromDate(updates.startDate)
  }
  if (updates.endDate) {
    updateData.endDate = Timestamp.fromDate(updates.endDate)
  }

  await updateDoc(employmentRef, updateData)
}

export async function deleteEmploymentHistory(id: string) {
  checkFirestore()
  const employmentRef = doc(db, "employment", id)
  await deleteDoc(employmentRef)
}

export async function createJobPost(job: Omit<JobPost, "id" | "createdAt">) {
  checkFirestore()
  const jobRef = collection(db, "jobs")
  const docRef = await addDoc(jobRef, {
    ...job,
    createdAt: Timestamp.now(),
    deadline: job.deadline ? Timestamp.fromDate(job.deadline) : null,
  })
  return docRef.id
}

export async function getJobPosts(filters?: { status?: string; clientId?: string }): Promise<JobPost[]> {
  checkFirestore()
  let q = query(collection(db, "jobs"), orderBy("createdAt", "desc"))

  if (filters?.status) {
    q = query(q, where("status", "==", filters.status))
  }

  if (filters?.clientId) {
    q = query(q, where("clientId", "==", filters.clientId))
  }

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    deadline: doc.data().deadline?.toDate() || undefined,
  })) as JobPost[]
}
