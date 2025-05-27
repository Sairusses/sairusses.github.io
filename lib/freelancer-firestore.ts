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
import React from "react";

export interface Job {
  id?: string
  title: string
  client: string // Changed from clientId to client
  clientName?: string // Will be populated from user lookup
  description: string
  fixedPrice?: number // Added for fixed price jobs
  hourlyRate?: number // Added for hourly jobs
  paymentType: "hourly" | "fixed" // Added payment type
  skills: string[]
  status?: "open" | "in-progress" | "completed" | "cancelled" // Made optional since it might not exist
  createdAt: Date
  deadline?: Date
  location?: string
  experienceLevel?: "entry" | "intermediate" | "expert" // Made optional
}

export interface FreelancerProfile {
  uid: string
  username: string // Changed from name to username
  email: string
  role: "freelancer"
  overview?: string
  skills?: string[]
  resume_url?: string // Changed from resumeUrl
  resume_name?: string // Added
  resume_fileKey?: string // Added
  employment_history?: EmploymentEntry[]
  createdAt: Date
}

export interface EmploymentEntry {
  company: string
  position: string
  startDate: string // Changed to string to match your data
  endDate?: string // Changed to string, can be "Present"
  description: string
}

export interface Proposal {
  id?: string
  jobId: string
  freelancerId: string
  jobTitle: string
  clientId: string
  proposalText: string
  coverLetter: string
  bidAmount: number
  status: "pending" | "viewed" | "accepted" | "rejected"
  createdAt: Date
}

export interface Contract {
  id?: string
  jobId: string
  freelancerId: string
  clientId: string
  jobTitle: string
  clientName: string
  status: "ongoing" | "completed" | "cancelled"
  startDate: Date
  endDate?: Date
  amount: number
}

export interface ChatMessage {
  id?: string
  senderId: string
  senderName: string
  message: string
  timestamp: Date
  read: boolean
}

export interface ChatThread {
  otherUserRole: React.ReactNode | undefined;
  otherUserName: String;
  id: string
  participants: string[] // Array of user IDs
  lastMessage: string
  lastMessageTime: Date
  unreadCount?: number
}

export interface FreelancerFile {
  id?: string
  fileName: string
  downloadURL: string
  uploadedAt: Date
  fileType: string
  size: number
}

// Check if Firestore is available
const checkFirestore = () => {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.")
  }
}

// Jobs
export async function getJobs(filters?: {
  skills?: string[]
  paymentType?: string
  sortBy?: "recent" | "budget" | "matches"
}): Promise<Job[]> {
  checkFirestore()

  const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"))

  const querySnapshot = await getDocs(q)
  let jobs = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    deadline: doc.data().deadline?.toDate() || undefined,
  })) as Job[]

  // Get client names for each job
  for (const job of jobs) {
    try {
      const clientDoc = await getDoc(doc(db, "users", job.client))
      if (clientDoc.exists()) {
        job.clientName = clientDoc.data().username || clientDoc.data().email
      }
    } catch (error) {
      console.error("Error fetching client name:", error)
      job.clientName = "Unknown Client"
    }
  }

  // Apply client-side filtering
  if (filters?.skills && filters.skills.length > 0) {
    if (filters.sortBy === "matches") {
      jobs = jobs.sort((a, b) => {
        const aMatches = a.skills.filter((skill) => filters.skills!.includes(skill)).length
        const bMatches = b.skills.filter((skill) => filters.skills!.includes(skill)).length
        return bMatches - aMatches
      })
    }
  }

  if (filters?.paymentType) {
    jobs = jobs.filter((job) => job.paymentType === filters.paymentType)
  }

  return jobs
}

export async function getJob(jobId: string): Promise<Job | null> {
  checkFirestore()
  const jobRef = doc(db, "jobs", jobId)
  const jobSnap = await getDoc(jobRef)

  if (jobSnap.exists()) {
    const data = jobSnap.data()
    return {
      id: jobSnap.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      deadline: data.deadline?.toDate() || undefined,
    } as Job
  }

  return null
}

// Proposals
export async function submitProposal(proposal: Omit<Proposal, "id" | "createdAt">) {
  checkFirestore()
  const proposalData = {
    ...proposal,
    createdAt: Timestamp.now(),
  }

  // Save to freelancer's proposals
  const freelancerProposalRef = collection(db, "users", proposal.freelancerId, "proposals")
  const freelancerDoc = await addDoc(freelancerProposalRef, proposalData)

  // Save to job's proposals
  const jobProposalRef = collection(db, "jobs", proposal.jobId, "proposals")
  await setDoc(doc(jobProposalRef, freelancerDoc.id), {
    ...proposalData,
    proposalId: freelancerDoc.id,
  })

  return freelancerDoc.id
}

export async function getFreelancerProposals(freelancerId: string): Promise<Proposal[]> {
  if (!freelancerId) {
    throw new Error("Invalid freelancer ID")
  }

  const q = query(
      collection(db, "users", freelancerId, "proposals"),
      orderBy("createdAt", "desc")
  )

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Proposal[]
}


// Contracts
export async function getFreelancerContracts(freelancerId: string): Promise<Contract[]> {
  checkFirestore()
  const q = query(collection(db, "users", freelancerId, "contracts"), orderBy("startDate", "desc"))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    startDate: doc.data().startDate.toDate(),
    endDate: doc.data().endDate?.toDate() || undefined,
  })) as Contract[]
}

// Messages - Fixed to avoid composite index requirement
export async function getChatThreads(userId: string): Promise<ChatThread[]> {
  checkFirestore()

  // Get all chat documents where the user is a participant
  const q = query(collection(db, "chats"), where("participants", "array-contains", userId))

  const querySnapshot = await getDocs(q)
  const threads = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    lastMessageTime: doc.data().lastMessageTime?.toDate() || new Date(),
  })) as ChatThread[]

  return threads.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime())
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  checkFirestore()
  const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate(),
  })) as ChatMessage[]
}

export async function sendMessage(chatId: string, message: {
  chatId: string;
  senderId: string;
  senderName: any;
  message: string;
  read: boolean
}) {
  checkFirestore()
  const messageData = {
    ...message,
    timestamp: Timestamp.now(),
  }

  await addDoc(collection(db, "chats", chatId, "messages"), messageData)

  // Update chat thread
  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: message.message,
    lastMessageTime: Timestamp.now(),
  })
}

// Files
export async function saveFileMetadata(userId: string, file: Omit<FreelancerFile, "id" | "uploadedAt">) {
  checkFirestore()
  const fileData = {
    ...file,
    uploadedAt: Timestamp.now(),
  }

  const fileRef = collection(db, "users", userId, "files")
  const docRef = await addDoc(fileRef, fileData)
  return docRef.id
}

export async function getFreelancerFiles(userId: string): Promise<FreelancerFile[]> {
  checkFirestore()
  const q = query(collection(db, "users", userId, "files"), orderBy("uploadedAt", "desc"))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    uploadedAt: doc.data().uploadedAt.toDate(),
  })) as FreelancerFile[]
}

export async function deleteFreelancerFile(userId: string, fileId: string) {
  checkFirestore()
  const fileRef = doc(db, "users", userId, "files", fileId)
  await deleteDoc(fileRef)
}

// Employment History
export async function updateEmploymentHistory(userId: string, history: any[]) {
  checkFirestore()
  const userRef = doc(db, "users", userId)
  await updateDoc(userRef, {
    employment_history: history.map((item) => ({
      ...item,
      startDate: item.startDate instanceof Date ? Timestamp.fromDate(item.startDate) : item.startDate,
      endDate: item.endDate instanceof Date ? Timestamp.fromDate(item.endDate) : item.endDate,
    })),
  })
}

// Skills
export async function updateSkills(userId: string, skills: string[]) {
  checkFirestore()
  const userRef = doc(db, "users", userId)
  await updateDoc(userRef, { skills })
}

// Add function to get all users for chat discovery
export async function getAllUsers(currentUserId: string): Promise<FreelancerProfile[]> {
  checkFirestore()
  const q = query(collection(db, "users"))

  const querySnapshot = await getDocs(q)
  const users = querySnapshot.docs
      .filter((doc) => doc.id !== currentUserId) // Exclude current user
      .map((doc) => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        employment_history: doc.data().employment_history || [],
      })) as FreelancerProfile[]

  return users
}

// Add function to create or get chat thread
export async function createOrGetChatThread(user1Id: string, user2Id: string): Promise<string> {
  checkFirestore()

  // Create consistent chat ID
  const chatId = [user1Id, user2Id].sort().join("_")

  const chatRef = doc(db, "chats", chatId)
  const chatDoc = await getDoc(chatRef)

  if (!chatDoc.exists()) {
    // Create new chat thread
    await setDoc(chatRef, {
      participants: [user1Id, user2Id],
      lastMessage: "",
      lastMessageTime: Timestamp.now(),
      createdAt: Timestamp.now(),
    })
  }

  return chatId
}
