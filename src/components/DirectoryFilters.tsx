import { Search } from 'lucide-react'
export default function DirectoryFilters({
  search,
  status,
  placeholder,
  onSearch,
  onStatus,
}: {
  search: string
  status: string
  placeholder: string
  onSearch: (value: string) => void
  onStatus: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
      <label className="field flex-1">
        <span>Search</span>
        <span className="relative">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400"
          />
          <input
            type="search"
            aria-label="Search directory"
            className="input !pl-10"
            value={search}
            maxLength={120}
            placeholder={placeholder}
            onChange={(e) => onSearch(e.target.value)}
          />
        </span>
      </label>
      <label className="field sm:w-44">
        <span>Status</span>
        <select
          aria-label="Filter by status"
          className="input"
          value={status}
          onChange={(e) => onStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </label>
    </div>
  )
}
