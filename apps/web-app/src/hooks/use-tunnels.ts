"use client"

import { useState, useEffect } from "react"
import type { Tunnel } from "@/components/types/tunnel"

// Mock data for tunnels
const mockTunnels: Tunnel[] = [
  {
    id: "tnl_1a2b3c4d5e6f7g8h9i0j",
    forwardingAddress: "https://tnl-1a2b3c.tunnel.example.com",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    status: "active",
    localPort: 3000,
  },
  {
    id: "tnl_2b3c4d5e6f7g8h9i0j1k",
    forwardingAddress: "https://tnl-2b3c4d.tunnel.example.com",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    status: "inactive",
    localPort: 8080,
  },
  {
    id: "tnl_3c4d5e6f7g8h9i0j1k2l",
    forwardingAddress: "https://tnl-3c4d5e.tunnel.example.com",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    status: "active",
    localPort: 4000,
  },
  {
    id: "tnl_4d5e6f7g8h9i0j1k2l3m",
    forwardingAddress: "https://tnl-4d5e6f.tunnel.example.com",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    status: "active",
    localPort: 5000,
  },
  {
    id: "tnl_5e6f7g8h9i0j1k2l3m4n",
    forwardingAddress: "https://tnl-5e6f7g.tunnel.example.com",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
    status: "inactive",
    localPort: 9000,
  },
]

export function useTunnels() {
  const [tunnels, setTunnels] = useState<Tunnel[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTunnels = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setTunnels(mockTunnels)
    } catch (error) {
      console.error("Failed to fetch tunnels:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const startTunnel = async (id: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      setTunnels((prev) => prev.map((tunnel) => (tunnel.id === id ? { ...tunnel, status: "active" } : tunnel)))
    } catch (error) {
      console.error("Failed to start tunnel:", error)
    }
  }

  const stopTunnel = async (id: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      setTunnels((prev) => prev.map((tunnel) => (tunnel.id === id ? { ...tunnel, status: "inactive" } : tunnel)))
    } catch (error) {
      console.error("Failed to stop tunnel:", error)
    }
  }

  const deleteTunnel = async (id: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      setTunnels((prev) => prev.filter((tunnel) => tunnel.id !== id))
    } catch (error) {
      console.error("Failed to delete tunnel:", error)
    }
  }

  useEffect(() => {
    fetchTunnels()
  }, [])

  return {
    tunnels,
    isLoading,
    refresh: fetchTunnels,
    startTunnel,
    stopTunnel,
    deleteTunnel,
  }
}

