"use client"

import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Users, Crown, Mail, UserCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

export default function TeamPage() {
  const { user, isLoaded } = useUser()
  
  // Sync user on page load
  const syncUser = useMutation(api.users.syncUser)
  const currentUser = useQuery(
    api.users.getCurrentUser,
    {} // Auth verified server-side via ctx.auth
  )
  
  const teamMembers = useQuery(
    api.users.listOrganizationUsers,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId } : "skip"
  )
  
  // Sync user if not exists
  useEffect(() => {
    if (user && isLoaded && !currentUser) {
      syncUser({
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || undefined,
      }).catch((error) => {
        console.error("Failed to sync user:", error)
      })
    }
  }, [user, isLoaded, currentUser, syncUser])
  
  if (!isLoaded || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }
  
  return (
    <DashboardLayout>
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <motion.div 
          className="flex justify-between items-start"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Team</h1>
          </div>
        </motion.div>
        
        {/* Team Members List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
            {teamMembers === undefined ? (
              <motion.div 
                className="text-center py-8 text-slate-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                Loading team members...
              </motion.div>
            ) : teamMembers.length === 0 ? (
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No team members yet</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={member._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                        <UserCircle className="h-6 w-6 text-slate-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">
                            {member.name || "Unknown User"}
                          </p>
                          {member.role === "admin" && (
                            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                              <Crown className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {member._id === currentUser?._id && (
                            <Badge variant="outline" className="bg-slate-100 text-slate-600">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

