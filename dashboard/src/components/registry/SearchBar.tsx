"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"

interface SearchBarProps {
  onSearchChange: (query: string) => void
  onFilterChange: (filter: "all" | "pending" | "resolved") => void
  currentFilter: "all" | "pending" | "resolved"
}

export function SearchBar({ onSearchChange, onFilterChange, currentFilter }: SearchBarProps) {
  const [searchValue, setSearchValue] = useState("")

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    onSearchChange(value)
  }

  const clearSearch = () => {
    setSearchValue("")
    onSearchChange("")
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search case ID, wallet address, or merchant..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10 h-12 text-base border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
        />
        {searchValue && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <Tabs value={currentFilter} onValueChange={(v) => onFilterChange(v as "all" | "pending" | "resolved")}>
        <TabsList className="w-full grid grid-cols-3 lg:w-auto">
          <TabsTrigger value="all" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            All Disputes
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            Pending
          </TabsTrigger>
          <TabsTrigger value="resolved" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Resolved
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}

