import React from 'react'

interface ListSkeletonProps {
  count?: number
  className?: string // allows customizing height and other details
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  count = 3,
  className = 'h-32'
}) => {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={`${className} glass-skeleton rounded-md`} 
        />
      ))}
    </div>
  )
}
